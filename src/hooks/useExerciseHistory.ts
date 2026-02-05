import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LastExercisePerformance {
  sessionName: string;
  sessionDate: string;
  weight: number | null;
  reps: number[] | null;
  notes: string | null;
}

export function useExerciseHistory() {
  const { user } = useAuth();

  /**
   * Get the last performance for a specific exercise.
   * Returns the most recent exercise log matching the exercise_id.
   */
  const getLastPerformance = useCallback(async (
    exerciseId: string
  ): Promise<LastExercisePerformance | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          weight_used,
          reps_completed,
          notes,
          created_at,
          session_history:session_history_id (
            session_name,
            completed_at
          )
        `)
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      if (!data) return null;

      const sessionHistory = data.session_history as {
        session_name: string;
        completed_at: string;
      } | null;

      return {
        sessionName: sessionHistory?.session_name || 'Séance précédente',
        sessionDate: sessionHistory?.completed_at || data.created_at,
        weight: data.weight_used?.[0] ?? null,
        reps: data.reps_completed,
        notes: data.notes,
      };
    } catch (error) {
      console.error('Error fetching exercise history:', error);
      return null;
    }
  }, [user]);

  /**
   * Get the last performance for multiple exercises at once.
   * More efficient than calling getLastPerformance multiple times.
   */
  const getLastPerformances = useCallback(async (
    exerciseIds: string[]
  ): Promise<Map<string, LastExercisePerformance>> => {
    const result = new Map<string, LastExercisePerformance>();
    if (!user || exerciseIds.length === 0) return result;

    try {
      // Get the latest entry for each exercise
      // We'll fetch more than needed and deduplicate client-side
      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          exercise_id,
          weight_used,
          reps_completed,
          notes,
          created_at,
          session_history:session_history_id (
            session_name,
            completed_at
          )
        `)
        .eq('user_id', user.id)
        .in('exercise_id', exerciseIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data) return result;

      // Keep only the first (most recent) entry for each exercise
      for (const log of data) {
        if (result.has(log.exercise_id)) continue;

        const sessionHistory = log.session_history as {
          session_name: string;
          completed_at: string;
        } | null;

        result.set(log.exercise_id, {
          sessionName: sessionHistory?.session_name || 'Séance précédente',
          sessionDate: sessionHistory?.completed_at || log.created_at,
          weight: log.weight_used?.[0] ?? null,
          reps: log.reps_completed,
          notes: log.notes,
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching exercise histories:', error);
      return result;
    }
  }, [user]);

  return {
    getLastPerformance,
    getLastPerformances,
  };
}
