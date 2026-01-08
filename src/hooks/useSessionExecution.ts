import { useState, useEffect, useCallback, useRef } from 'react';
import type { StoredSession, Block, Exercise } from '@/types/jsonSession';
import { getNumericValue, formatRange } from '@/types/jsonSession';

// Execution state types
export type ExecutionPhase = 
  | 'idle'           // Not started yet
  | 'block_intro'    // Showing block overview before starting
  | 'exercise_work'  // Performing exercise (countdown or free)
  | 'exercise_rest'  // Rest after a set
  | 'between_exercises' // Rest between exercises (circuit)
  | 'between_rounds'    // Rest between circuit rounds
  | 'complete';         // Session finished

export interface ExecutionState {
  phase: ExecutionPhase;
  currentBlockIndex: number;
  currentExerciseIndex: number;
  currentSet: number;      // 1-indexed
  currentRound: number;    // 1-indexed, for circuits
  totalSets: number;
  totalRounds: number;
  timeRemaining: number;   // seconds
  timeElapsed: number;     // seconds since phase started
  isTimerRunning: boolean;
  isFreeExercise: boolean; // No timer enforced
}

export interface UseSessionExecutionReturn {
  state: ExecutionState;
  currentBlock: Block | null;
  currentExercise: Exercise | null;
  
  // Actions
  startSession: () => void;
  startBlock: () => void;
  finishSet: () => void;      // For free exercises
  skipRest: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  nextExercise: () => void;
  previousExercise: () => void;
  nextBlock: () => void;
  restartSession: () => void;
  
  // Progress info
  blockProgress: string;
  exerciseProgress: string;
  setProgress: string;
  roundProgress: string;
}

const STORAGE_KEY_PREFIX = 'gym-session-progress-';

function getInitialState(): ExecutionState {
  return {
    phase: 'idle',
    currentBlockIndex: 0,
    currentExerciseIndex: 0,
    currentSet: 1,
    currentRound: 1,
    totalSets: 1,
    totalRounds: 1,
    timeRemaining: 0,
    timeElapsed: 0,
    isTimerRunning: false,
    isFreeExercise: false,
  };
}

export function useSessionExecution(session: StoredSession): UseSessionExecutionReturn {
  const [state, setState] = useState<ExecutionState>(getInitialState);
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const { blocks } = session;
  const currentBlock = blocks[state.currentBlockIndex] || null;
  const currentExercise = currentBlock?.exercises[state.currentExerciseIndex] || null;

  // Save progress to localStorage
  useEffect(() => {
    if (state.phase !== 'idle' && state.phase !== 'complete') {
      const key = STORAGE_KEY_PREFIX + session.session.session_id;
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [state, session.session.session_id]);

  // Timer tick
  const tick = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    setState(prev => {
      if (!prev.isTimerRunning) return prev;

      const newTimeElapsed = prev.timeElapsed + delta;
      const newTimeRemaining = Math.max(0, prev.timeRemaining - delta);

      if (newTimeRemaining <= 0) {
        // Timer finished - auto-advance
        return {
          ...prev,
          timeElapsed: newTimeElapsed,
          timeRemaining: 0,
          isTimerRunning: false,
        };
      }

      return {
        ...prev,
        timeElapsed: newTimeElapsed,
        timeRemaining: newTimeRemaining,
      };
    });

    animationRef.current = requestAnimationFrame(tick);
  }, []);

  // Start/stop animation frame
  useEffect(() => {
    if (state.isTimerRunning) {
      lastTickRef.current = performance.now();
      animationRef.current = requestAnimationFrame(tick);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isTimerRunning, tick]);

  // Calculate sets/rounds for current exercise/block
  const getTotalSets = useCallback((exercise: Exercise): number => {
    return getNumericValue(exercise.sets) || 1;
  }, []);

  const getTotalRounds = useCallback((block: Block): number => {
    return getNumericValue(block.rounds) || 1;
  }, []);

  const getExerciseWorkDuration = useCallback((exercise: Exercise): number | null => {
    // For timed_hold or isometric exercises
    if (exercise.execution_type === 'timed_hold' || exercise.execution_type === 'isometric') {
      return getNumericValue(exercise.duration_sec) || getNumericValue(exercise.isometric_hold_sec) || null;
    }
    return getNumericValue(exercise.duration_sec) || null;
  }, []);

  const getRestAfterSet = useCallback((exercise: Exercise): number => {
    return getNumericValue(exercise.rest_after_set_sec) || 0;
  }, []);

  const getRestBetweenExercises = useCallback((block: Block): number => {
    return getNumericValue(block.rest_between_exercises_sec) || 0;
  }, []);

  const getRestBetweenRounds = useCallback((block: Block): number => {
    return getNumericValue(block.rest_between_rounds_sec) || 0;
  }, []);

  const getBlockDuration = useCallback((block: Block): number | null => {
    return getNumericValue(block.duration_sec) || null;
  }, []);

  // Actions
  const startSession = useCallback(() => {
    setState({
      ...getInitialState(),
      phase: 'block_intro',
    });
  }, []);

  const startBlock = useCallback(() => {
    if (!currentBlock) return;

    const blockType = currentBlock.block_type;
    const firstExercise = currentBlock.exercises[0];

    if (!firstExercise) {
      // Empty block, skip to next
      setState(prev => ({
        ...prev,
        currentBlockIndex: prev.currentBlockIndex + 1,
        phase: prev.currentBlockIndex + 1 >= blocks.length ? 'complete' : 'block_intro',
      }));
      return;
    }

    if (blockType === 'activation' || blockType === 'cardio') {
      const duration = getBlockDuration(currentBlock);
      if (duration) {
        // Timed activation/cardio block
        setState(prev => ({
          ...prev,
          phase: 'exercise_work',
          currentExerciseIndex: 0,
          currentSet: 1,
          currentRound: 1,
          totalSets: 1,
          totalRounds: 1,
          timeRemaining: duration,
          timeElapsed: 0,
          isTimerRunning: false,
          isFreeExercise: false,
        }));
      } else {
        // Free activation block
        setState(prev => ({
          ...prev,
          phase: 'exercise_work',
          currentExerciseIndex: 0,
          currentSet: 1,
          currentRound: 1,
          totalSets: 1,
          totalRounds: 1,
          timeRemaining: 0,
          timeElapsed: 0,
          isTimerRunning: false,
          isFreeExercise: true,
        }));
      }
    } else if (blockType === 'circuit') {
      const rounds = getTotalRounds(currentBlock);
      const workDuration = getExerciseWorkDuration(firstExercise);

      setState(prev => ({
        ...prev,
        phase: 'exercise_work',
        currentExerciseIndex: 0,
        currentSet: 1,
        currentRound: 1,
        totalSets: 1,
        totalRounds: rounds,
        timeRemaining: workDuration || 0,
        timeElapsed: 0,
        isTimerRunning: false,
        isFreeExercise: !workDuration,
      }));
    } else {
      // Standard block
      const sets = getTotalSets(firstExercise);
      const workDuration = getExerciseWorkDuration(firstExercise);

      setState(prev => ({
        ...prev,
        phase: 'exercise_work',
        currentExerciseIndex: 0,
        currentSet: 1,
        currentRound: 1,
        totalSets: sets,
        totalRounds: 1,
        timeRemaining: workDuration || 0,
        timeElapsed: 0,
        isTimerRunning: false,
        isFreeExercise: !workDuration,
      }));
    }
  }, [currentBlock, blocks.length, getBlockDuration, getTotalRounds, getTotalSets, getExerciseWorkDuration]);

  const finishSet = useCallback(() => {
    if (!currentBlock || !currentExercise) return;

    const blockType = currentBlock.block_type;

    if (blockType === 'activation' || blockType === 'cardio') {
      // Move to next block
      const nextBlockIndex = state.currentBlockIndex + 1;
      if (nextBlockIndex >= blocks.length) {
        setState(prev => ({ ...prev, phase: 'complete' }));
      } else {
        setState(prev => ({
          ...prev,
          currentBlockIndex: nextBlockIndex,
          currentExerciseIndex: 0,
          phase: 'block_intro',
        }));
      }
      return;
    }

    if (blockType === 'circuit') {
      // In circuit: after exercise, go to rest between exercises or next round
      const restBetweenEx = getRestBetweenExercises(currentBlock);
      const nextExIndex = state.currentExerciseIndex + 1;
      const exerciseCount = currentBlock.exercises.length;

      if (nextExIndex < exerciseCount) {
        // More exercises in this round
        if (restBetweenEx > 0) {
          setState(prev => ({
            ...prev,
            phase: 'between_exercises',
            timeRemaining: restBetweenEx,
            timeElapsed: 0,
            isTimerRunning: false,
          }));
        } else {
          // No rest, go directly to next exercise
          const nextExercise = currentBlock.exercises[nextExIndex];
          const workDuration = getExerciseWorkDuration(nextExercise);
          setState(prev => ({
            ...prev,
            currentExerciseIndex: nextExIndex,
            timeRemaining: workDuration || 0,
            timeElapsed: 0,
            isFreeExercise: !workDuration,
          }));
        }
      } else {
        // Finished round
        const nextRound = state.currentRound + 1;
        if (nextRound <= state.totalRounds) {
          const restBetweenRounds = getRestBetweenRounds(currentBlock);
          if (restBetweenRounds > 0) {
            setState(prev => ({
              ...prev,
              phase: 'between_rounds',
              timeRemaining: restBetweenRounds,
              timeElapsed: 0,
              isTimerRunning: false,
            }));
          } else {
            // Start next round
            const firstExercise = currentBlock.exercises[0];
            const workDuration = getExerciseWorkDuration(firstExercise);
            setState(prev => ({
              ...prev,
              phase: 'exercise_work',
              currentExerciseIndex: 0,
              currentRound: nextRound,
              timeRemaining: workDuration || 0,
              timeElapsed: 0,
              isFreeExercise: !workDuration,
            }));
          }
        } else {
          // Circuit complete, move to next block
          const nextBlockIndex = state.currentBlockIndex + 1;
          if (nextBlockIndex >= blocks.length) {
            setState(prev => ({ ...prev, phase: 'complete' }));
          } else {
            setState(prev => ({
              ...prev,
              currentBlockIndex: nextBlockIndex,
              currentExerciseIndex: 0,
              currentRound: 1,
              phase: 'block_intro',
            }));
          }
        }
      }
      return;
    }

    // Standard block: set finished, go to rest
    const restTime = getRestAfterSet(currentExercise);
    if (restTime > 0) {
      setState(prev => ({
        ...prev,
        phase: 'exercise_rest',
        timeRemaining: restTime,
        timeElapsed: 0,
        isTimerRunning: false,
      }));
    } else {
      // No rest, advance to next set or exercise
      advanceAfterRest();
    }
  }, [currentBlock, currentExercise, state, blocks.length, getRestBetweenExercises, getRestBetweenRounds, getExerciseWorkDuration, getRestAfterSet]);

  const advanceAfterRest = useCallback(() => {
    if (!currentBlock || !currentExercise) return;

    const blockType = currentBlock.block_type;

    if (blockType === 'circuit') {
      // After between_exercises rest: go to next exercise
      // After between_rounds rest: start new round
      if (state.phase === 'between_exercises') {
        const nextExIndex = state.currentExerciseIndex + 1;
        const nextExercise = currentBlock.exercises[nextExIndex];
        const workDuration = getExerciseWorkDuration(nextExercise);
        setState(prev => ({
          ...prev,
          phase: 'exercise_work',
          currentExerciseIndex: nextExIndex,
          timeRemaining: workDuration || 0,
          timeElapsed: 0,
          isTimerRunning: false,
          isFreeExercise: !workDuration,
        }));
      } else if (state.phase === 'between_rounds') {
        const firstExercise = currentBlock.exercises[0];
        const workDuration = getExerciseWorkDuration(firstExercise);
        setState(prev => ({
          ...prev,
          phase: 'exercise_work',
          currentExerciseIndex: 0,
          currentRound: prev.currentRound + 1,
          timeRemaining: workDuration || 0,
          timeElapsed: 0,
          isTimerRunning: false,
          isFreeExercise: !workDuration,
        }));
      }
      return;
    }

    // Standard block: after set rest
    const nextSet = state.currentSet + 1;
    if (nextSet <= state.totalSets) {
      // More sets for this exercise
      const workDuration = getExerciseWorkDuration(currentExercise);
      setState(prev => ({
        ...prev,
        phase: 'exercise_work',
        currentSet: nextSet,
        timeRemaining: workDuration || 0,
        timeElapsed: 0,
        isTimerRunning: false,
        isFreeExercise: !workDuration,
      }));
    } else {
      // Move to next exercise
      const nextExIndex = state.currentExerciseIndex + 1;
      if (nextExIndex < currentBlock.exercises.length) {
        const nextExercise = currentBlock.exercises[nextExIndex];
        const sets = getTotalSets(nextExercise);
        const workDuration = getExerciseWorkDuration(nextExercise);
        setState(prev => ({
          ...prev,
          phase: 'exercise_work',
          currentExerciseIndex: nextExIndex,
          currentSet: 1,
          totalSets: sets,
          timeRemaining: workDuration || 0,
          timeElapsed: 0,
          isTimerRunning: false,
          isFreeExercise: !workDuration,
        }));
      } else {
        // Block complete, move to next block
        const nextBlockIndex = state.currentBlockIndex + 1;
        if (nextBlockIndex >= blocks.length) {
          setState(prev => ({ ...prev, phase: 'complete' }));
        } else {
          setState(prev => ({
            ...prev,
            currentBlockIndex: nextBlockIndex,
            currentExerciseIndex: 0,
            currentSet: 1,
            phase: 'block_intro',
          }));
        }
      }
    }
  }, [currentBlock, currentExercise, state, blocks.length, getTotalSets, getExerciseWorkDuration]);

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (state.timeRemaining <= 0 && !state.isTimerRunning && state.phase !== 'idle' && state.phase !== 'block_intro' && state.phase !== 'complete') {
      // Timer finished, check if we should auto-advance
      if (state.phase === 'exercise_rest' || state.phase === 'between_exercises' || state.phase === 'between_rounds') {
        // After rest phases, auto-advance
        advanceAfterRest();
      } else if (state.phase === 'exercise_work' && !state.isFreeExercise && state.timeElapsed > 0) {
        // Timed exercise finished, go to rest or next
        finishSet();
      }
    }
  }, [state.timeRemaining, state.isTimerRunning, state.phase, state.isFreeExercise, state.timeElapsed, advanceAfterRest, finishSet]);

  const skipRest = useCallback(() => {
    advanceAfterRest();
  }, [advanceAfterRest]);

  const startTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTimerRunning: true,
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTimerRunning: false,
    }));
  }, []);

  const nextExercise = useCallback(() => {
    if (!currentBlock) return;
    
    const nextExIndex = state.currentExerciseIndex + 1;
    if (nextExIndex < currentBlock.exercises.length) {
      const nextEx = currentBlock.exercises[nextExIndex];
      const sets = getTotalSets(nextEx);
      const workDuration = getExerciseWorkDuration(nextEx);
      
      setState(prev => ({
        ...prev,
        phase: 'exercise_work',
        currentExerciseIndex: nextExIndex,
        currentSet: 1,
        totalSets: sets,
        timeRemaining: workDuration || 0,
        timeElapsed: 0,
        isTimerRunning: false,
        isFreeExercise: !workDuration,
      }));
    } else {
      // End of block, go to next block
      nextBlock();
    }
  }, [currentBlock, state.currentExerciseIndex, getTotalSets, getExerciseWorkDuration]);

  const previousExercise = useCallback(() => {
    if (!currentBlock) return;
    
    const prevExIndex = state.currentExerciseIndex - 1;
    if (prevExIndex >= 0) {
      const prevEx = currentBlock.exercises[prevExIndex];
      const sets = getTotalSets(prevEx);
      const workDuration = getExerciseWorkDuration(prevEx);
      
      setState(prev => ({
        ...prev,
        phase: 'exercise_work',
        currentExerciseIndex: prevExIndex,
        currentSet: 1,
        totalSets: sets,
        timeRemaining: workDuration || 0,
        timeElapsed: 0,
        isTimerRunning: false,
        isFreeExercise: !workDuration,
      }));
    }
  }, [currentBlock, state.currentExerciseIndex, getTotalSets, getExerciseWorkDuration]);

  const nextBlock = useCallback(() => {
    const nextBlockIndex = state.currentBlockIndex + 1;
    if (nextBlockIndex >= blocks.length) {
      setState(prev => ({ ...prev, phase: 'complete' }));
    } else {
      setState(prev => ({
        ...prev,
        currentBlockIndex: nextBlockIndex,
        currentExerciseIndex: 0,
        currentSet: 1,
        currentRound: 1,
        phase: 'block_intro',
      }));
    }
  }, [state.currentBlockIndex, blocks.length]);

  const restartSession = useCallback(() => {
    setState(getInitialState());
  }, []);

  // Progress strings
  const blockProgress = `Bloc ${state.currentBlockIndex + 1} / ${blocks.length}`;
  const exerciseProgress = currentBlock 
    ? `Exercice ${state.currentExerciseIndex + 1} / ${currentBlock.exercises.length}`
    : '';
  const setProgress = state.totalSets > 1 
    ? `Série ${state.currentSet} / ${state.totalSets}`
    : '';
  const roundProgress = state.totalRounds > 1
    ? `Tour ${state.currentRound} / ${state.totalRounds}`
    : '';

  return {
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
  };
}
