import { useEffect, useCallback, useState } from 'react';
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
  Dumbbell,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StoredSession } from '@/types/jsonSession';
import { 
  BLOCK_TYPE_FR, 
  formatRange,
  getNumericValue,
} from '@/types/jsonSession';
import { useSessionExecution } from '@/hooks/useSessionExecution';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { useAuth } from '@/contexts/AuthContext';
import { audioManager } from '@/lib/audio';
import { haptics } from '@/lib/haptics';
import { wakeLockManager } from '@/lib/wakeLock';
import { SetPerformanceEditor } from './SetPerformanceEditor';
import { SessionCompleteScreen } from './SessionCompleteScreen';
import { TargetWeightEditor } from './TargetWeightEditor';
import { PreviousPerformance } from './PreviousPerformance';
import { toast } from '@/hooks/use-toast';

interface SessionRunScreenProps {
  session: StoredSession;
  savedSessionId?: string;
  scheduledSessionId?: string;
  onBack: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimerValue(seconds: number, isOvertime: boolean): string {
  const formattedTime = formatTime(Math.max(0, seconds));
  return isOvertime ? `+${formattedTime}` : formattedTime;
}

export function SessionRunScreen({ 
  session, 
  savedSessionId,
  scheduledSessionId,
  onBack 
}: SessionRunScreenProps) {
  const { user } = useAuth();
  const { recordSession } = useSessionHistory();
  const [isSaving, setIsSaving] = useState(false);

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

  const {
    performanceData,
    setTargetWeight,
    setActualWeight,
    setActualReps,
    markSetCompleted,
    setSessionNotes,
    setRating,
    initializeExercise,
    getExercisePerformance,
    getSetPerformance,
    getExerciseLogs,
    reset: resetPerformance,
  } = usePerformanceTracking();

  // Initialize exercise performance when entering an exercise
  useEffect(() => {
    if (currentExercise && state.phase === 'exercise_work') {
      initializeExercise(currentExercise, state.totalSets);
    }
  }, [currentExercise, state.phase, state.totalSets, initializeExercise]);

  // Mark set as completed when finishing a set
  const handleFinishSetWithTracking = useCallback(() => {
    if (currentExercise) {
      markSetCompleted(currentExercise.exercise_id, state.currentSet - 1);
    }
    haptics.medium();
    audioManager.playPhaseChange('rest');
    finishSet();
  }, [currentExercise, state.currentSet, markSetCompleted, finishSet]);

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
    resetPerformance();
    restartSession();
  }, [restartSession, resetPerformance]);

  const handleExit = useCallback(() => {
    wakeLockManager.release();
    onBack();
  }, [onBack]);

  const handleSaveSession = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour sauvegarder vos séances',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const durationSeconds = Math.floor(
        (Date.now() - performanceData.startedAt.getTime()) / 1000
      );

      const result = await recordSession({
        savedSessionId,
        scheduledSessionId,
        sessionName: session.session.session_name,
        sessionData: session,
        startedAt: performanceData.startedAt,
        durationSeconds,
        notes: performanceData.sessionNotes || undefined,
        rating: performanceData.rating,
        exerciseLogs: getExerciseLogs(),
      });

      if (result) {
        toast({
          title: 'Séance sauvegardée !',
          description: 'Votre performance a été enregistrée',
        });
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la séance',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, performanceData, session, savedSessionId, scheduledSessionId, recordSession, getExerciseLogs]);

  // Phase-specific colors
  const getPhaseColor = () => {
    switch (state.phase) {
      case 'circuit_launch':
        return 'phase-rest';
      case 'exercise_work':
        return 'phase-activity';
      case 'exercise_rest':
      case 'between_exercises':
      case 'between_rounds':
        return state.timeRemaining <= 0 ? 'text-destructive' : 'phase-rest';
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
      case 'circuit_launch':
        return 'Timer de lancement';
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

        <div className="flex-1 flex flex-col p-6 pb-28 md:pb-6 overflow-hidden">
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
            {currentBlock.block_type === 'circuit' && (
              <p className="text-sm text-muted-foreground mt-2">
                Timer de lancement : {currentBlock.launch_timer_sec ?? 15}s
              </p>
            )}
          </div>

          {/* Exercise list preview with target weight */}
          <div className="flex-1 overflow-auto">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {currentBlock.exercises.length} exercice{currentBlock.exercises.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-3">
              {currentBlock.exercises.map((ex, idx) => {
                const perf = getExercisePerformance(ex.exercise_id);
                const targetWeight = perf?.sets[0]?.targetWeight;
                
                return (
                  <Card key={ex.exercise_id} className="bg-secondary/50">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-3">
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
                        {/* Target weight button for standard/circuit blocks */}
                        {(currentBlock.block_type === 'standard' || currentBlock.block_type === 'circuit') && (
                          <TargetWeightEditor
                            exercise={ex}
                            totalSets={getNumericValue(ex.sets) || 1}
                            currentTargetWeight={targetWeight}
                            onSetTargetWeight={(weight) => {
                              initializeExercise(ex, getNumericValue(ex.sets) || 1);
                              // Set target weight for all sets
                              const sets = getNumericValue(ex.sets) || 1;
                              for (let i = 0; i < sets; i++) {
                                setTargetWeight(ex.exercise_id, i, weight);
                              }
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Previous performance for this exercise */}
                      {(currentBlock.block_type === 'standard' || currentBlock.block_type === 'circuit') && (
                        <PreviousPerformance exercise={ex} />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Start block button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom md:static md:p-0 md:pt-6 md:bg-transparent md:border-0 md:backdrop-blur-none">
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

  // Render complete screen with notes and saving
  if (state.phase === 'complete') {
    return (
      <SessionCompleteScreen
        session={session}
        performanceData={performanceData}
        onSetNotes={setSessionNotes}
        onSetRating={setRating}
        onSave={handleSaveSession}
        onRestart={handleRestart}
        onExit={handleExit}
        isSaving={isSaving}
      />
    );
  }

  // Main execution screen
  const isRestPhase = state.phase === 'exercise_rest' || 
                       state.phase === 'between_exercises' || 
                       state.phase === 'between_rounds';
  const isLaunchPhase = state.phase === 'circuit_launch';

  const showTimer = !state.isFreeExercise || isRestPhase || isLaunchPhase;
  const isRestOvertime = isRestPhase && state.timeRemaining <= 0;

  const getRestTargetDuration = () => {
    if (!currentBlock) return 0;

    if (state.phase === 'exercise_rest' && currentExercise) {
      return getNumericValue(currentExercise.rest_after_set_sec) || 0;
    }

    if (state.phase === 'between_exercises') {
      return getNumericValue(currentBlock.rest_between_exercises_sec) || 0;
    }

    if (state.phase === 'between_rounds') {
      return getNumericValue(currentBlock.rest_between_rounds_sec) || 0;
    }

    return 0;
  };

  const restTargetDuration = getRestTargetDuration();

  const progressPercent = isRestPhase
    ? (restTargetDuration > 0
      ? Math.min((state.timeElapsed / restTargetDuration) * 100, 100)
      : 100)
    : isLaunchPhase
      ? ((currentBlock?.launch_timer_sec ?? 15) > 0
        ? Math.min((state.timeElapsed / (currentBlock?.launch_timer_sec ?? 15)) * 100, 100)
        : 100)
    : (state.timeRemaining > 0
      ? ((state.timeElapsed) / (state.timeElapsed + state.timeRemaining)) * 100
      : 100);

  // Get current set performance for editing during rest
  const currentSetPerformance = currentExercise 
    ? getSetPerformance(currentExercise.exercise_id, state.currentSet - 1)
    : undefined;

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
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        {/* REST PHASE: Show exercise info at top */}
        {isRestPhase && currentExercise && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <p className="text-sm text-muted-foreground mb-1">Exercice en cours</p>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {currentExercise.exercise_name}
            </h2>
            <div className="flex justify-center gap-4 text-sm">
              <div className="bg-secondary rounded-lg px-3 py-1.5">
                <span className="text-muted-foreground">Fait: </span>
                <span className="font-bold text-foreground">{state.currentSet}</span>
              </div>
              <div className="bg-primary/20 rounded-lg px-3 py-1.5">
                <span className="text-muted-foreground">Reste: </span>
                <span className="font-bold text-primary">{state.totalSets - state.currentSet}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Centered timer area */}
        <div className="flex-1 flex flex-col items-center justify-center">
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
                variant={isRestPhase || isLaunchPhase ? 'secondary' : 'default'}
                className={`text-sm px-4 py-1 ${(isRestPhase || isLaunchPhase) ? 'bg-timer-rest/20 text-timer-rest' : ''}`}
              >
                {getPhaseLabel()}
              </Badge>
            </motion.div>
          </AnimatePresence>

          {currentBlock && state.phase === 'circuit_launch' && (
            <div className="text-center mb-6 px-4 w-full max-w-md">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Prépare-toi à démarrer
              </h2>
              <p className="text-muted-foreground mb-4">
                Place-toi avant le début du circuit.
              </p>
              {currentExercise && (
                <div className="bg-secondary/50 rounded-xl p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Premier exercice</p>
                  <p className="font-semibold text-foreground">{currentExercise.exercise_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Tour 1
                    {currentExercise.duration_sec && ` • ${formatRange(currentExercise.duration_sec, 's')}`}
                    {currentExercise.reps && ` • ${formatRange(currentExercise.reps)} reps`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Exercise info - WORK PHASE */}
          {currentExercise && state.phase === 'exercise_work' && (
            <div className="text-center mb-6 px-4 w-full">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {currentExercise.exercise_name}
              </h2>
              
              {/* Bilateral side indicator */}
              {state.bilateralSide && (
                <motion.div
                  key={state.bilateralSide}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-3"
                >
                  <Badge 
                    variant="outline" 
                    className={`text-lg px-4 py-1.5 font-bold ${
                      state.bilateralSide === 'left' 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-400' 
                        : 'bg-orange-500/20 text-orange-400 border-orange-400'
                    }`}
                  >
                    {state.bilateralSide === 'left' ? '← CÔTÉ GAUCHE' : 'CÔTÉ DROIT →'}
                  </Badge>
                </motion.div>
              )}
              
              {/* Key metrics: Reps, Sets, RIR, Weight */}
              <div className="flex flex-wrap justify-center gap-3 mb-4">
                {currentExercise.reps && (
                  <div className="bg-secondary rounded-xl px-4 py-2">
                    <p className="text-xs text-muted-foreground">Reps</p>
                    <p className="text-lg font-bold text-foreground">{formatRange(currentExercise.reps)}</p>
                  </div>
                )}
                {currentExercise.reps_per_side && (
                  <div className="bg-secondary rounded-xl px-4 py-2">
                    <p className="text-xs text-muted-foreground">Reps/côté</p>
                    <p className="text-lg font-bold text-foreground">{formatRange(currentExercise.reps_per_side)}</p>
                  </div>
                )}
                <div className="bg-secondary rounded-xl px-4 py-2">
                  <p className="text-xs text-muted-foreground">Série</p>
                  <p className="text-lg font-bold text-foreground">{state.currentSet}/{state.totalSets}</p>
                </div>
                {currentExercise.rir !== null && currentExercise.rir !== undefined && (
                  <div className="bg-primary/20 rounded-xl px-4 py-2 border-2 border-primary/30">
                    <p className="text-xs text-primary font-medium">RIR</p>
                    <p className="text-lg font-bold text-primary">{formatRange(currentExercise.rir)}</p>
                  </div>
                )}
                {/* Show target weight: from performance tracking or from JSON definition */}
                {(() => {
                  const perf = getSetPerformance(currentExercise.exercise_id, state.currentSet - 1);
                  const weight = perf?.targetWeight || currentExercise.target_weight;
                  if (weight) {
                    return (
                      <div className="bg-accent/20 rounded-xl px-4 py-2 border-2 border-accent/30">
                        <p className="text-xs text-accent-foreground font-medium">Poids cible</p>
                        <p className="text-lg font-bold text-accent-foreground">{weight} kg</p>
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Rest time */}
                {(() => {
                  const restSec = getNumericValue(currentExercise.rest_after_set_sec) 
                    || getNumericValue(currentBlock?.rest_between_exercises_sec);
                  if (restSec) {
                    return (
                      <div className="bg-secondary rounded-xl px-4 py-2">
                        <p className="text-xs text-muted-foreground">Repos</p>
                        <p className="text-lg font-bold text-foreground">{restSec}s</p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Secondary info */}
              <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground mb-3">
                {currentExercise.tempo && (
                  <span className="bg-secondary/50 px-2 py-0.5 rounded">Tempo: {currentExercise.tempo}</span>
                )}
                {currentExercise.isometric_hold_sec && (
                  <span className="bg-secondary/50 px-2 py-0.5 rounded">Hold: {formatRange(currentExercise.isometric_hold_sec, 's')}</span>
                )}
              </div>

              {/* Previous performance - compact view during work */}
              <PreviousPerformance exercise={currentExercise} compact />

              {/* Coaching cues */}
              {currentExercise.coaching_cues && currentExercise.coaching_cues.length > 0 && (
                <div className="mt-3 p-3 bg-secondary/50 rounded-lg text-left max-w-sm mx-auto">
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
            <div className="mb-6">
              <motion.div
                className={`timer-digits ${getPhaseColor()}`}
                key={Math.floor(state.timeRemaining)}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
              >
                {formatTimerValue(isRestOvertime ? Math.abs(state.timeRemaining) : state.timeRemaining, isRestOvertime)}
              </motion.div>
              
              {/* Progress bar */}
              <Progress value={progressPercent} className="h-2 mt-4 w-64" />
            </div>
          )}

          {/* Free exercise - elapsed time */}
          {state.isFreeExercise && state.phase === 'exercise_work' && (
            <div className="mb-6 text-center">
              <p className="text-muted-foreground text-sm mb-2">Temps écoulé</p>
              <div className="text-4xl font-display text-foreground">
                {formatTime(state.timeElapsed)}
              </div>
            </div>
          )}
        </div>

        {/* REST PHASE: Performance editor (hidden in circuit blocks) */}
        {isRestPhase && currentExercise && currentBlock?.block_type !== 'circuit' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <SetPerformanceEditor
              exercise={currentExercise}
              setIndex={state.currentSet - 1}
              performance={currentSetPerformance}
              onUpdateReps={(reps) => setActualReps(currentExercise.exercise_id, state.currentSet - 1, reps)}
              onUpdateWeight={(weight) => setActualWeight(currentExercise.exercise_id, state.currentSet - 1, weight)}
            />
          </motion.div>
        )}

        {/* REST PHASE: Show next exercise at bottom */}
        {isRestPhase && currentBlock && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-auto pt-4"
          >
            {(() => {
              // Always show the NEXT exercise (not next set)
              const nextExIndex = state.currentExerciseIndex + 1;
              const nextExercise = currentBlock.exercises[nextExIndex];
              
              if (!nextExercise) {
                // Check if there's a next block
                const nextBlockIndex = state.currentBlockIndex + 1;
                const nextBlock = session.blocks[nextBlockIndex];
                if (nextBlock && nextBlock.exercises.length > 0) {
                  const firstExerciseOfNextBlock = nextBlock.exercises[0];
                  return (
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1 text-center">Prochain exercice</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {firstExerciseOfNextBlock.exercise_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {nextBlock.block_name}
                            {firstExerciseOfNextBlock.target_weight != null && ` • ${firstExerciseOfNextBlock.target_weight} kg`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }

              return (
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1 text-center">Prochain exercice</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {nextExercise.exercise_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatRange(nextExercise.sets)} série{(getNumericValue(nextExercise.sets) || 1) > 1 ? 's' : ''}
                        {nextExercise.reps && ` • ${formatRange(nextExercise.reps)} reps`}
                        {nextExercise.rir !== null && nextExercise.rir !== undefined && ` • RIR ${formatRange(nextExercise.rir)}`}
                        {nextExercise.target_weight != null && ` • ${nextExercise.target_weight} kg`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
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
                Série faite
              </Button>
            </div>
          </div>
        )}

        {/* Work phase controls */}
        {(state.phase === 'exercise_work' || state.phase === 'circuit_launch') && (
          <div className="space-y-3">
            {/* Timed exercise / launch countdown */}
            {(state.phase === 'circuit_launch' || !state.isFreeExercise) ? (
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
                    {state.timeElapsed > 0 ? 'Reprendre' : (state.phase === 'circuit_launch' ? 'Lancer le circuit' : 'Démarrer')}
                  </>
                )}
              </Button>
            ) : (
              /* Free exercise - big finish button */
              <Button
                variant="default"
                size="xl"
                onClick={handleFinishSetWithTracking}
                className="w-full h-20 text-xl rounded-xl bg-timer-activity hover:bg-timer-activity/90"
              >
                <Check className="w-8 h-8 mr-3" />
                Série terminée
              </Button>
            )}

            {/* Navigation */}
            {state.phase === 'exercise_work' && (
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
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
