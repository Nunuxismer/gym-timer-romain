import { useState, useCallback } from 'react';
import type { Exercise } from '@/types/jsonSession';

// Performance data for a single set
export interface SetPerformance {
  targetWeight?: number;
  actualWeight?: number;
  targetReps?: number;
  actualReps?: number;
  completed: boolean;
}

// Performance data for an exercise across all sets
export interface ExercisePerformance {
  exerciseId: string;
  exerciseName: string;
  sets: SetPerformance[];
}

// Full session performance tracking
export interface SessionPerformanceData {
  exercises: Map<string, ExercisePerformance>;
  sessionNotes: string;
  rating?: number;
  startedAt: Date;
}

export interface UsePerformanceTrackingReturn {
  performanceData: SessionPerformanceData;
  
  // Target weights (set during planning or before starting)
  setTargetWeight: (exerciseId: string, setIndex: number, weight: number) => void;
  setTargetReps: (exerciseId: string, setIndex: number, reps: number) => void;
  
  // Actual performance (recorded during session)
  setActualWeight: (exerciseId: string, setIndex: number, weight: number) => void;
  setActualReps: (exerciseId: string, setIndex: number, reps: number) => void;
  markSetCompleted: (exerciseId: string, setIndex: number) => void;
  
  // Session-level
  setSessionNotes: (notes: string) => void;
  setRating: (rating: number) => void;
  
  // Helpers
  initializeExercise: (exercise: Exercise, totalSets: number) => void;
  getExercisePerformance: (exerciseId: string) => ExercisePerformance | undefined;
  getSetPerformance: (exerciseId: string, setIndex: number) => SetPerformance | undefined;
  
  // Export for saving
  getExerciseLogs: () => Array<{
    exerciseId: string;
    exerciseName: string;
    setsCompleted: number;
    repsCompleted: number[];
    weightUsed: number[];
    notes?: string;
  }>;
  
  reset: () => void;
}

function createInitialData(): SessionPerformanceData {
  return {
    exercises: new Map(),
    sessionNotes: '',
    rating: undefined,
    startedAt: new Date(),
  };
}

export function usePerformanceTracking(): UsePerformanceTrackingReturn {
  const [performanceData, setPerformanceData] = useState<SessionPerformanceData>(createInitialData);

  const initializeExercise = useCallback((exercise: Exercise, totalSets: number) => {
    setPerformanceData(prev => {
      const existing = prev.exercises.get(exercise.exercise_id);
      if (existing) return prev; // Already initialized
      
      const newExercises = new Map(prev.exercises);
      const sets: SetPerformance[] = [];
      
      for (let i = 0; i < totalSets; i++) {
        sets.push({
          targetWeight: exercise.target_weight ?? undefined,
          actualWeight: undefined,
          targetReps: undefined,
          actualReps: undefined,
          completed: false,
        });
      }
      
      newExercises.set(exercise.exercise_id, {
        exerciseId: exercise.exercise_id,
        exerciseName: exercise.exercise_name,
        sets,
      });
      
      return { ...prev, exercises: newExercises };
    });
  }, []);

  const updateSetField = useCallback((
    exerciseId: string,
    setIndex: number,
    field: keyof SetPerformance,
    value: number | boolean
  ) => {
    setPerformanceData(prev => {
      const exercise = prev.exercises.get(exerciseId);
      if (!exercise || setIndex >= exercise.sets.length) return prev;
      
      const newExercises = new Map(prev.exercises);
      const newSets = [...exercise.sets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      
      newExercises.set(exerciseId, { ...exercise, sets: newSets });
      
      return { ...prev, exercises: newExercises };
    });
  }, []);

  const setTargetWeight = useCallback((exerciseId: string, setIndex: number, weight: number) => {
    updateSetField(exerciseId, setIndex, 'targetWeight', weight);
  }, [updateSetField]);

  const setTargetReps = useCallback((exerciseId: string, setIndex: number, reps: number) => {
    updateSetField(exerciseId, setIndex, 'targetReps', reps);
  }, [updateSetField]);

  const setActualWeight = useCallback((exerciseId: string, setIndex: number, weight: number) => {
    updateSetField(exerciseId, setIndex, 'actualWeight', weight);
  }, [updateSetField]);

  const setActualReps = useCallback((exerciseId: string, setIndex: number, reps: number) => {
    updateSetField(exerciseId, setIndex, 'actualReps', reps);
  }, [updateSetField]);

  const markSetCompleted = useCallback((exerciseId: string, setIndex: number) => {
    updateSetField(exerciseId, setIndex, 'completed', true);
  }, [updateSetField]);

  const setSessionNotes = useCallback((notes: string) => {
    setPerformanceData(prev => ({ ...prev, sessionNotes: notes }));
  }, []);

  const setRating = useCallback((rating: number) => {
    setPerformanceData(prev => ({ ...prev, rating }));
  }, []);

  const getExercisePerformance = useCallback((exerciseId: string): ExercisePerformance | undefined => {
    return performanceData.exercises.get(exerciseId);
  }, [performanceData.exercises]);

  const getSetPerformance = useCallback((exerciseId: string, setIndex: number): SetPerformance | undefined => {
    const exercise = performanceData.exercises.get(exerciseId);
    if (!exercise || setIndex >= exercise.sets.length) return undefined;
    return exercise.sets[setIndex];
  }, [performanceData.exercises]);

  const getExerciseLogs = useCallback(() => {
    const logs: Array<{
      exerciseId: string;
      exerciseName: string;
      setsCompleted: number;
      repsCompleted: number[];
      weightUsed: number[];
      notes?: string;
    }> = [];

    performanceData.exercises.forEach((exercise) => {
      const completedSets = exercise.sets.filter(s => s.completed);
      if (completedSets.length === 0) return;

      logs.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        setsCompleted: completedSets.length,
        repsCompleted: completedSets.map(s => s.actualReps ?? s.targetReps ?? 0),
        weightUsed: completedSets.map(s => s.actualWeight ?? s.targetWeight ?? 0),
      });
    });

    return logs;
  }, [performanceData.exercises]);

  const reset = useCallback(() => {
    setPerformanceData(createInitialData());
  }, []);

  return {
    performanceData,
    setTargetWeight,
    setTargetReps,
    setActualWeight,
    setActualReps,
    markSetCompleted,
    setSessionNotes,
    setRating,
    initializeExercise,
    getExercisePerformance,
    getSetPerformance,
    getExerciseLogs,
    reset,
  };
}
