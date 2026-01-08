import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  X, 
  Check,
  Clock,
  Dumbbell,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StoredSession } from '@/types/jsonSession';
import { 
  BLOCK_TYPE_FR, 
  MOVEMENT_PATTERN_FR, 
  formatRange,
  getNumericValue,
} from '@/types/jsonSession';
import { useSessionExecution } from '@/hooks/useSessionExecution';
import { audioManager } from '@/lib/audio';
import { haptics } from '@/lib/haptics';
import { wakeLockManager } from '@/lib/wakeLock';

interface SessionRunScreenProps {
  session: StoredSession;
  onBack: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SessionRunScreen({ session, onBack }: SessionRunScreenProps) {
  const {
    state,
    currentBlock,
    currentExercise,
    startSession,
    startBlock,
    finishSet,
    skipRest,
    startTimer,
    pauseTimer,
    nextExercise,
    previousExercise,
    nextBlock,
    restartSession,
    blockProgress,
    exerciseProgress,
    setProgress,
    roundProgress,
  } = useSessionExecution(session);

  // Wake lock
  useEffect(() => {
    wakeLockManager.acquire();
    return () => {
      wakeLockManager.release();
    };
  }, []);

  // Audio/haptic feedback
  useEffect(() => {
    if (state.phase === 'complete') {
      audioManager.playComplete();
      haptics.heavy();
    }
  }, [state.phase]);

  // Countdown beeps
  useEffect(() => {
    if (state.isTimerRunning && state.timeRemaining <= 3 && state.timeRemaining > 0) {
      const rounded = Math.ceil(state.timeRemaining);
      if (Math.abs(state.timeRemaining - rounded) < 0.1) {
        audioManager.playCountdownBeep();
        haptics.light();
      }
    }
  }, [state.isTimerRunning, state.timeRemaining]);

  const handleStartSession = useCallback(() => {
    audioManager.init();
    haptics.medium();
    startSession();
  }, [startSession]);

  const handleStartBlock = useCallback(() => {
    haptics.medium();
    audioManager.speak(currentBlock?.block_name || 'Démarrage', true);
    startBlock();
  }, [startBlock, currentBlock]);

  const handleFinishSet = useCallback(() => {
    haptics.medium();
    audioManager.playPhaseChange('rest');
    finishSet();
  }, [finishSet]);

  const handleSkipRest = useCallback(() => {
    haptics.light();
    skipRest();
  }, [skipRest]);

  const handlePlayPause = useCallback(() => {
    haptics.light();
    if (state.isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [state.isTimerRunning, pauseTimer, startTimer]);

  const handleNext = useCallback(() => {
    haptics.light();
    nextExercise();
  }, [nextExercise]);

  const handlePrev = useCallback(() => {
    haptics.light();
    previousExercise();
  }, [previousExercise]);

  const handleNextBlock = useCallback(() => {
    haptics.medium();
    nextBlock();
  }, [nextBlock]);

  const handleRestart = useCallback(() => {
    haptics.medium();
    restartSession();
  }, [restartSession]);

  const handleExit = useCallback(() => {
    wakeLockManager.release();
    onBack();
  }, [onBack]);

  // Phase-specific colors
  const getPhaseColor = () => {
    switch (state.phase) {
      case 'exercise_work':
        return 'phase-activity';
      case 'exercise_rest':
      case 'between_exercises':
      case 'between_rounds':
        return 'phase-rest';
      case 'complete':
        return 'phase-complete';
      default:
        return 'text-foreground';
    }
  };

  const getPhaseLabel = () => {
    switch (state.phase) {
      case 'idle':
        return 'Prêt à démarrer';
      case 'block_intro':
        return 'Prochain bloc';
      case 'exercise_work':
        return state.isFreeExercise ? 'Exercice libre' : 'Effort';
      case 'exercise_rest':
        return 'Repos';
      case 'between_exercises':
        return 'Repos entre exercices';
      case 'between_rounds':
        return 'Repos entre tours';
      case 'complete':
        return 'Séance terminée !';
      default:
        return '';
    }
  };

  // Render idle screen
  if (state.phase === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background flex flex-col"
      >
        <header className="p-4 flex items-center justify-between border-b border-border">
          <Button variant="ghost" size="icon" onClick={handleExit}>
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground truncate flex-1 text-center mx-4">
            {session.session.session_name}
          </h1>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Prêt à commencer ?
            </h2>
            <p className="text-muted-foreground">
              {session.blocks.length} bloc{session.blocks.length > 1 ? 's' : ''} • 
              ~{session.session.estimated_duration_min} min
            </p>
          </div>

          <Button
            variant="default"
            size="xl"
            onClick={handleStartSession}
            className="w-full max-w-xs h-20 text-xl rounded-2xl shadow-lg"
          >
            <Play className="w-8 h-8 mr-3" />
            Démarrer la séance
          </Button>
        </div>
      </motion.div>
    );
  }

  // Render block intro screen
  if (state.phase === 'block_intro' && currentBlock) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="min-h-screen bg-background flex flex-col"
      >
        <header className="p-4 flex items-center justify-between border-b border-border">
          <Button variant="ghost" size="icon" onClick={handleExit}>
            <X className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">{blockProgress}</span>
          <Button variant="ghost" size="sm" onClick={handleNextBlock}>
            Passer
            <SkipForward className="w-4 h-4 ml-1" />
          </Button>
        </header>

        <div className="flex-1 flex flex-col p-6">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-2">
              {BLOCK_TYPE_FR[currentBlock.block_type]}
            </Badge>
            <h2 className="text-2xl font-bold text-foreground">
              {currentBlock.block_name}
            </h2>
            {currentBlock.block_description && (
              <p className="text-muted-foreground mt-2">
                {currentBlock.block_description}
              </p>
            )}
          </div>

          {/* Exercise list preview */}
          <div className="flex-1 overflow-auto">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {currentBlock.exercises.length} exercice{currentBlock.exercises.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-2">
              {currentBlock.exercises.map((ex, idx) => (
                <Card key={ex.exercise_id} className="bg-secondary/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{ex.exercise_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRange(ex.sets)} série{(getNumericValue(ex.sets) || 1) > 1 ? 's' : ''} 
                        {ex.reps && ` • ${formatRange(ex.reps)} reps`}
                        {ex.duration_sec && ` • ${formatRange(ex.duration_sec, 's')}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Start block button */}
          <div className="pt-6">
            <Button
              variant="default"
              size="xl"
              onClick={handleStartBlock}
              className="w-full h-16 text-lg rounded-xl"
            >
              <Play className="w-6 h-6 mr-2" />
              {currentBlock.block_type === 'activation' ? "Démarrer l'activation" : 'Démarrer le bloc'}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Render complete screen
  if (state.phase === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
      >
        <div className="w-24 h-24 rounded-full bg-timer-complete/20 flex items-center justify-center mb-6">
          <Check className="w-12 h-12 text-timer-complete" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Séance terminée !
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Excellent travail ! 💪
        </p>

        <div className="space-y-3 w-full max-w-xs">
          <Button
            variant="default"
            size="lg"
            onClick={handleRestart}
            className="w-full"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Recommencer
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleExit}
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </div>
      </motion.div>
    );
  }

  // Main execution screen
  const isRestPhase = state.phase === 'exercise_rest' || 
                       state.phase === 'between_exercises' || 
                       state.phase === 'between_rounds';

  const showTimer = !state.isFreeExercise || isRestPhase;
  const progressPercent = state.timeRemaining > 0 
    ? ((state.timeElapsed) / (state.timeElapsed + state.timeRemaining)) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <Button variant="ghost" size="icon" onClick={handleExit}>
          <X className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{blockProgress}</p>
          {currentBlock && (
            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {currentBlock.block_name}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleNextBlock}>
          <SkipForward className="w-4 h-4" />
        </Button>
      </header>

      {/* Progress indicators */}
      <div className="px-4 py-2 flex flex-wrap gap-2 justify-center border-b border-border">
        {exerciseProgress && (
          <Badge variant="outline">{exerciseProgress}</Badge>
        )}
        {roundProgress && (
          <Badge variant="secondary">{roundProgress}</Badge>
        )}
        {setProgress && (
          <Badge variant="outline">{setProgress}</Badge>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Phase label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.phase}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-4"
          >
            <Badge 
              variant={isRestPhase ? 'secondary' : 'default'}
              className={`text-sm px-4 py-1 ${isRestPhase ? 'bg-timer-rest/20 text-timer-rest' : ''}`}
            >
              {getPhaseLabel()}
            </Badge>
          </motion.div>
        </AnimatePresence>

        {/* Exercise info */}
        {currentExercise && state.phase === 'exercise_work' && (
          <div className="text-center mb-6 px-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {currentExercise.exercise_name}
            </h2>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
              {currentExercise.reps && (
                <span>{formatRange(currentExercise.reps)} reps</span>
              )}
              {currentExercise.reps_per_side && (
                <span>{formatRange(currentExercise.reps_per_side)} reps/côté</span>
              )}
              {currentExercise.tempo && (
                <span>Tempo: {currentExercise.tempo}</span>
              )}
            </div>
            {currentExercise.coaching_cues && currentExercise.coaching_cues.length > 0 && (
              <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-left">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Info className="w-3 h-3" />
                  Consignes
                </div>
                <ul className="text-sm text-foreground space-y-0.5">
                  {currentExercise.coaching_cues.slice(0, 2).map((cue, i) => (
                    <li key={i}>• {cue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Timer display */}
        {showTimer && (
          <div className="mb-8">
            <motion.div
              className={`timer-digits ${getPhaseColor()}`}
              key={Math.floor(state.timeRemaining)}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
            >
              {formatTime(state.timeRemaining)}
            </motion.div>
            
            {/* Progress bar */}
            <Progress 
              value={progressPercent} 
              className="h-2 mt-4 w-64"
            />
          </div>
        )}

        {/* Free exercise - elapsed time */}
        {state.isFreeExercise && state.phase === 'exercise_work' && (
          <div className="mb-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">Temps écoulé</p>
            <div className="text-4xl font-display text-foreground">
              {formatTime(state.timeElapsed)}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-border safe-bottom">
        {/* Rest phase controls */}
        {isRestPhase && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePlayPause}
                className="flex-1"
              >
                {state.isTimerRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Reprendre
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={handleSkipRest}
                className="flex-1"
              >
                <SkipForward className="w-5 h-5 mr-2" />
                Passer le repos
              </Button>
            </div>
          </div>
        )}

        {/* Work phase controls */}
        {state.phase === 'exercise_work' && (
          <div className="space-y-3">
            {/* Timed exercise */}
            {!state.isFreeExercise ? (
              <Button
                variant="default"
                size="xl"
                onClick={handlePlayPause}
                className="w-full h-16 text-lg rounded-xl"
              >
                {state.isTimerRunning ? (
                  <>
                    <Pause className="w-6 h-6 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 mr-2" />
                    {state.timeElapsed > 0 ? 'Reprendre' : 'Démarrer'}
                  </>
                )}
              </Button>
            ) : (
              /* Free exercise - big finish button */
              <Button
                variant="default"
                size="xl"
                onClick={handleFinishSet}
                className="w-full h-20 text-xl rounded-xl bg-timer-activity hover:bg-timer-activity/90"
              >
                <Check className="w-8 h-8 mr-3" />
                Série terminée
              </Button>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrev}
                disabled={state.currentExerciseIndex === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleNext}
                className="flex-1"
              >
                Suivant
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
