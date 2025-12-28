import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerPreset, TimerState } from '@/types/timer';
import { TimerEngine } from '@/lib/TimerEngine';
import { wakeLockManager } from '@/lib/wakeLock';
import { audioManager } from '@/lib/audio';
import { Button } from '@/components/ui/button';
import { ProgressBar, CycleProgress } from '@/components/ProgressBar';
import { Play, Pause, SkipForward, RotateCcw, X, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RunScreenProps {
  preset: TimerPreset;
  onStop: () => void;
}

export function RunScreen({ preset, onStop }: RunScreenProps) {
  const [state, setState] = useState<TimerState | null>(null);
  const [locked, setLocked] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const engineRef = useRef<TimerEngine | null>(null);
  const unlockTimerRef = useRef<number | null>(null);
  const wakeLockAcquired = useRef(false);

  useEffect(() => {
    // Initialize audio context on mount
    audioManager.init();
    
    // Acquire wake lock
    wakeLockManager.acquire().then((acquired) => {
      wakeLockAcquired.current = acquired;
    });

    // Create timer engine
    engineRef.current = new TimerEngine(preset, setState);
    engineRef.current.start();

    return () => {
      engineRef.current?.destroy();
      wakeLockManager.release();
    };
  }, [preset]);

  const formatTime = useCallback((ms: number, countUp: boolean = false) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getDisplayTime = useCallback(() => {
    if (!state) return '0:00';
    
    if (state.phase === 'activity' && preset.activityMode === 'countup') {
      return formatTime(state.timeElapsed);
    }
    return formatTime(state.timeRemaining);
  }, [state, preset.activityMode, formatTime]);

  const handlePlayPause = useCallback(() => {
    if (!engineRef.current) return;
    
    if (state?.isRunning) {
      engineRef.current.pause();
    } else if (state?.isPaused) {
      engineRef.current.resume();
    } else {
      engineRef.current.start();
    }
  }, [state]);

  const handleSkip = useCallback(() => {
    engineRef.current?.skip();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  const handleStop = useCallback(() => {
    engineRef.current?.stop();
    onStop();
  }, [onStop]);

  const handleRelaunch = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  // Lock controls logic
  const startUnlock = useCallback(() => {
    let progress = 0;
    const interval = 50;
    const duration = 2000;
    const increment = interval / duration;

    unlockTimerRef.current = window.setInterval(() => {
      progress += increment;
      setUnlockProgress(progress);

      if (progress >= 1) {
        setLocked(false);
        setUnlockProgress(0);
        if (unlockTimerRef.current) {
          clearInterval(unlockTimerRef.current);
          unlockTimerRef.current = null;
        }
      }
    }, interval);
  }, []);

  const cancelUnlock = useCallback(() => {
    if (unlockTimerRef.current) {
      clearInterval(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    setUnlockProgress(0);
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const phaseLabels = {
    idle: 'Prêt',
    preparation: 'Préparation',
    activity: 'Activité',
    rest: 'Repos',
    complete: 'Terminé!',
  };

  const phaseColors = {
    idle: '',
    preparation: 'phase-prep',
    activity: 'phase-activity',
    rest: 'phase-rest',
    complete: 'phase-complete',
  };

  const phaseBgColors = {
    idle: 'bg-muted',
    preparation: 'bg-timer-prep/10',
    activity: 'bg-timer-activity/10',
    rest: 'bg-timer-rest/10',
    complete: 'bg-timer-complete/10',
  };

  const progress = state.phaseDuration > 0 
    ? (state.phaseDuration - state.timeRemaining) / state.phaseDuration 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'min-h-screen flex flex-col transition-colors duration-500',
        phaseBgColors[state.phase]
      )}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm font-medium">
            {preset.name || 'Timer'}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocked(!locked)}
            className={locked ? 'text-timer-prep' : ''}
          >
            {locked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        {/* Phase label */}
        <motion.div
          key={state.phase}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'text-2xl font-semibold mb-2 uppercase tracking-wider',
            phaseColors[state.phase]
          )}
        >
          {phaseLabels[state.phase]}
        </motion.div>

        {/* Cycle indicator */}
        {state.phase !== 'idle' && state.phase !== 'complete' && (
          <div className="text-muted-foreground text-lg mb-4">
            Cycle {state.currentCycle} / {state.totalCycles}
          </div>
        )}

        {/* Big timer digits */}
        <AnimatePresence mode="wait">
          <motion.div
            key={getDisplayTime()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'timer-digits-xxl',
              phaseColors[state.phase],
              state.timeRemaining <= 3000 && state.isRunning && 'animate-pulse-glow'
            )}
          >
            {state.phase === 'complete' ? '✓' : getDisplayTime()}
          </motion.div>
        </AnimatePresence>

        {/* Phase progress bar */}
        {state.phase !== 'idle' && state.phase !== 'complete' && (
          <ProgressBar
            progress={progress}
            phase={state.phase as 'preparation' | 'activity' | 'rest'}
            className="w-full max-w-xs mt-8"
            showGlow
          />
        )}

        {/* Cycle progress */}
        {state.totalCycles > 1 && state.phase !== 'complete' && (
          <CycleProgress
            currentCycle={state.currentCycle}
            totalCycles={state.totalCycles}
            className="w-full max-w-xs mt-4"
          />
        )}
      </div>

      {/* Controls */}
      <div className="p-4 safe-bottom">
        {locked ? (
          <div className="text-center">
            <Button
              variant="outline"
              size="xl"
              className="w-full max-w-xs relative overflow-hidden"
              onTouchStart={startUnlock}
              onTouchEnd={cancelUnlock}
              onMouseDown={startUnlock}
              onMouseUp={cancelUnlock}
              onMouseLeave={cancelUnlock}
            >
              <div
                className="absolute inset-0 bg-timer-prep/20 transition-all"
                style={{ width: `${unlockProgress * 100}%` }}
              />
              <span className="relative z-10">
                Maintenir 2s pour déverrouiller
              </span>
            </Button>
          </div>
        ) : state.phase === 'complete' ? (
          <div className="flex gap-3 max-w-md mx-auto">
            <Button
              variant="timerStart"
              size="xl"
              onClick={handleRelaunch}
              className="flex-1"
            >
              <RotateCcw className="w-6 h-6" />
              Relancer
            </Button>
            <Button
              variant="outline"
              size="xl"
              onClick={handleStop}
              className="flex-1"
            >
              <X className="w-6 h-6" />
              Terminer
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 max-w-md mx-auto">
            <Button
              variant="timerControl"
              size="iconXl"
              onClick={handleRestart}
            >
              <RotateCcw className="w-6 h-6" />
            </Button>

            <Button
              variant={state.isRunning ? 'timerPause' : 'timerStart'}
              size="xl"
              onClick={handlePlayPause}
              className="flex-1"
            >
              {state.isRunning ? (
                <>
                  <Pause className="w-7 h-7" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-7 h-7" />
                  {state.isPaused ? 'Reprendre' : 'Démarrer'}
                </>
              )}
            </Button>

            <Button
              variant="timerControl"
              size="iconXl"
              onClick={handleSkip}
            >
              <SkipForward className="w-6 h-6" />
            </Button>

            <Button
              variant="timerStop"
              size="iconXl"
              onClick={handleStop}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
