import { useState, useEffect, useRef, useCallback } from 'react';
import { RestTimerPreset, RestTimerState } from '@/types/restTimer';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ProgressBar';
import { ArrowLeft, RotateCcw, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioManager } from '@/lib/audio';
import { haptics } from '@/lib/haptics';
import { wakeLockManager } from '@/lib/wakeLock';

interface RestTimerRunScreenProps {
  preset: Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'>;
  onBack: () => void;
}

export function RestTimerRunScreen({ preset, onBack }: RestTimerRunScreenProps) {
  const [state, setState] = useState<RestTimerState>({
    isRunning: false,
    currentSet: 1,
    totalSets: preset.totalSets,
    restSeconds: preset.restSeconds,
    timeElapsed: 0,
    timeRemaining: preset.restSeconds,
  });

  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastBeepRef = useRef<number>(-1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tick = useCallback(() => {
    const now = performance.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    const remaining = preset.restSeconds - elapsed;

    // Beep last 3 seconds
    const secondsLeft = Math.ceil(remaining);
    if (secondsLeft <= 3 && secondsLeft > 0 && secondsLeft !== lastBeepRef.current) {
      lastBeepRef.current = secondsLeft;
      audioManager.playCountdownBeep();
      haptics.light();
    }

    if (remaining <= 0) {
      // Rest complete
      audioManager.playPhaseChange('activity');
      haptics.heavy();
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        timeElapsed: preset.restSeconds,
        timeRemaining: 0,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      timeElapsed: elapsed,
      timeRemaining: remaining,
    }));

    animationRef.current = requestAnimationFrame(tick);
  }, [preset.restSeconds]);

  const startRest = useCallback(() => {
    if (state.currentSet > preset.totalSets) {
      return;
    }

    audioManager.init();
    audioManager.speak(`Repos série ${state.currentSet} sur ${preset.totalSets}`);
    haptics.medium();
    
    startTimeRef.current = performance.now();
    lastBeepRef.current = -1;
    
    setState(prev => ({
      ...prev,
      isRunning: true,
      timeElapsed: 0,
      timeRemaining: preset.restSeconds,
    }));

    animationRef.current = requestAnimationFrame(tick);
  }, [state.currentSet, preset.totalSets, preset.restSeconds, tick]);

  const nextSet = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const nextSetNum = state.currentSet + 1;
    
    if (nextSetNum > preset.totalSets) {
      setIsComplete(true);
      audioManager.playComplete();
      haptics.heavy();
      wakeLockManager.release();
      return;
    }

    setState({
      isRunning: false,
      currentSet: nextSetNum,
      totalSets: preset.totalSets,
      restSeconds: preset.restSeconds,
      timeElapsed: 0,
      timeRemaining: preset.restSeconds,
    });
  }, [state.currentSet, preset.totalSets, preset.restSeconds]);

  const skipRest = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Skip rest means rest is done, advance to next set
    const nextSetNum = state.currentSet + 1;
    
    if (nextSetNum > preset.totalSets) {
      setIsComplete(true);
      audioManager.playComplete();
      haptics.heavy();
      wakeLockManager.release();
      return;
    }

    setState({
      isRunning: false,
      currentSet: nextSetNum,
      totalSets: preset.totalSets,
      restSeconds: preset.restSeconds,
      timeElapsed: 0,
      timeRemaining: preset.restSeconds,
    });
  }, [state.currentSet, preset.totalSets, preset.restSeconds]);

  const restart = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsComplete(false);
    setState({
      isRunning: false,
      currentSet: 1,
      totalSets: preset.totalSets,
      restSeconds: preset.restSeconds,
      timeElapsed: 0,
      timeRemaining: preset.restSeconds,
    });
  }, [preset.totalSets, preset.restSeconds]);

  useEffect(() => {
    wakeLockManager.acquire();
    audioManager.init();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      wakeLockManager.release();
    };
  }, []);

  const setsRemaining = preset.totalSets - state.currentSet;
  const progress = state.isRunning 
    ? (state.timeElapsed / preset.restSeconds) * 100 
    : (state.timeRemaining === 0 ? 100 : 0);

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="font-display text-4xl text-foreground mb-2">Terminé !</h1>
          <p className="text-muted-foreground mb-8">
            {preset.totalSets} séries complétées
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="timerStart" size="lg" onClick={restart}>
              <RotateCcw className="w-5 h-5" />
              Recommencer
            </Button>
            <Button variant="outline" size="lg" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
              Retour
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <span className="text-muted-foreground">
          {preset.name || 'Timer repos'}
        </span>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Sets indicator */}
        <div className="text-center mb-6">
          <div className="text-muted-foreground text-lg mb-1">Série</div>
          <div className="font-display text-5xl text-primary">
            {state.currentSet}<span className="text-muted-foreground text-3xl">/{preset.totalSets}</span>
          </div>
          <div className="text-muted-foreground mt-2">
            {setsRemaining > 0 ? `${setsRemaining} série${setsRemaining > 1 ? 's' : ''} restante${setsRemaining > 1 ? 's' : ''}` : 'Dernière série'}
          </div>
        </div>

        {/* Timer display */}
        <AnimatePresence mode="wait">
          {state.isRunning ? (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              {/* Time remaining (big) */}
              <div className="mb-4">
                <div className="text-muted-foreground text-sm mb-1">Temps restant</div>
                <div className={`font-display text-8xl tabular-nums ${state.timeRemaining <= 3 ? 'text-destructive' : 'phase-rest'}`}>
                  {formatTime(state.timeRemaining)}
                </div>
              </div>

              {/* Time elapsed */}
              <div className="text-muted-foreground">
                <span className="text-sm">Écoulé: </span>
                <span className="font-mono text-lg">{formatTime(state.timeElapsed)}</span>
              </div>

              {/* Progress bar */}
              <div className="w-64 mt-6">
                <ProgressBar progress={progress} phase="rest" />
              </div>

              {/* Skip button */}
              <Button
                variant="outline"
                size="lg"
                onClick={skipRest}
                className="mt-8"
              >
                <SkipForward className="w-5 h-5" />
                Passer le repos
              </Button>
            </motion.div>
          ) : state.timeRemaining === 0 ? (
            <motion.div
              key="restComplete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="text-2xl text-primary mb-6">Repos terminé !</div>
              <Button
                variant="timerStart"
                size="xl"
                onClick={nextSet}
                className="w-64 h-32 text-2xl"
              >
                {state.currentSet < preset.totalSets ? (
                  <>Série {state.currentSet + 1} terminée ?</>
                ) : (
                  <>Terminer l'exercice</>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="text-muted-foreground text-xl mb-6">
                Appuyez quand la série est terminée
              </div>
              <Button
                variant="timerStart"
                size="xl"
                onClick={startRest}
                className="w-64 h-40 text-2xl flex flex-col gap-2"
              >
                <span>Série {state.currentSet}</span>
                <span className="text-lg opacity-80">terminée</span>
              </Button>
              <div className="text-muted-foreground mt-6">
                Repos prévu: {formatTime(preset.restSeconds)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="p-4 safe-bottom">
        <Button
          variant="ghost"
          size="lg"
          onClick={restart}
          className="w-full"
        >
          <RotateCcw className="w-5 h-5" />
          Recommencer
        </Button>
      </div>
    </motion.div>
  );
}
