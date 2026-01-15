import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { JsonSession } from '@/types/jsonSession';
import type { Json } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { sessionPerformanceInputSchema, validateInput } from '@/lib/validation';
export interface ExerciseLog {
  id: string;
  session_history_id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  sets_completed: number | null;
  reps_completed: number[] | null;
  weight_used: number[] | null;
  notes: string | null;
  created_at: string;
}

export interface SessionHistoryEntry {
  id: string;
  user_id: string;
  saved_session_id: string | null;
  scheduled_session_id: string | null;
  session_name: string;
  session_data: JsonSession | null;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  notes: string | null;
  rating: number | null;
  created_at: string;
  exercise_logs?: ExerciseLog[];
}

export interface SessionPerformanceInput {
  savedSessionId?: string;
  scheduledSessionId?: string;
  sessionName: string;
  sessionData?: JsonSession;
  startedAt: Date;
  durationSeconds: number;
  notes?: string;
  rating?: number;
  exerciseLogs?: Array<{
    exerciseId: string;
    exerciseName: string;
    setsCompleted?: number;
    repsCompleted?: number[];
    weightUsed?: number[];
    notes?: string;
  }>;
}

function jsonToSession(json: Json | null): JsonSession | null {
  if (!json) return null;
  return json as unknown as JsonSession;
}

function sessionToJson(session: JsonSession | undefined): Json | null {
  if (!session) return null;
  return session as unknown as Json;
}

export function useSessionHistory() {
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('session_history')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      const typedData: SessionHistoryEntry[] = (data || []).map(item => ({
        ...item,
        session_data: jsonToSession(item.session_data)
      }));
      
      setHistory(typedData);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'historique',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const recordSession = useCallback(async (input: SessionPerformanceInput): Promise<SessionHistoryEntry | null> => {
    if (!user) return null;

    // Validate input before database operation
    const validation = validateInput(sessionPerformanceInputSchema, input);
    if (!validation.success) {
      toast({
        title: 'Erreur de validation',
        description: 'error' in validation ? validation.error : 'Données invalides',
        variant: 'destructive',
      });
      return null;
    }

    const validatedInput = validation.data as SessionPerformanceInput;

    try {
      // Insert session history
      const { data: historyData, error: historyError } = await supabase
        .from('session_history')
        .insert({
          user_id: user.id,
          saved_session_id: validatedInput.savedSessionId || null,
          scheduled_session_id: validatedInput.scheduledSessionId || null,
          session_name: validatedInput.sessionName,
          session_data: sessionToJson(validatedInput.sessionData),
          started_at: validatedInput.startedAt.toISOString(),
          duration_seconds: validatedInput.durationSeconds,
          notes: validatedInput.notes || null,
          rating: validatedInput.rating || null,
        })
        .select()
        .single();

      if (historyError) throw historyError;

      // Insert exercise logs if provided
      if (input.exerciseLogs && input.exerciseLogs.length > 0) {
        const logsToInsert = input.exerciseLogs.map(log => ({
          session_history_id: historyData.id,
          user_id: user.id,
          exercise_id: log.exerciseId,
          exercise_name: log.exerciseName,
          sets_completed: log.setsCompleted || null,
          reps_completed: log.repsCompleted || null,
          weight_used: log.weightUsed || null,
          notes: log.notes || null,
        }));

        const { error: logsError } = await supabase
          .from('exercise_logs')
          .insert(logsToInsert);

        if (logsError) {
          console.error('Error inserting exercise logs:', logsError);
        }
      }

      // Mark scheduled session as completed if applicable
      if (input.scheduledSessionId) {
        await supabase
          .from('scheduled_sessions')
          .update({ completed: true })
          .eq('id', input.scheduledSessionId);
      }

      const typedEntry: SessionHistoryEntry = {
        ...historyData,
        session_data: jsonToSession(historyData.session_data)
      };
      
      setHistory(prev => [typedEntry, ...prev]);
      return typedEntry;
    } catch (error) {
      console.error('Error recording session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la séance',
        variant: 'destructive',
      });
      return null;
    }
  }, [user]);

  const getExerciseLogs = useCallback(async (sessionHistoryId: string): Promise<ExerciseLog[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('session_history_id', sessionHistoryId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching exercise logs:', error);
      return [];
    }
  }, [user]);

  const getExerciseHistory = useCallback(async (exerciseId: string, limit: number = 10): Promise<ExerciseLog[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching exercise history:', error);
      return [];
    }
  }, [user]);

  const deleteHistoryEntry = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('session_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(h => h.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting history entry:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'entrée',
        variant: 'destructive',
      });
      return false;
    }
  }, [user]);

  return {
    history,
    loading,
    recordSession,
    getExerciseLogs,
    getExerciseHistory,
    deleteHistoryEntry,
    refetch: fetchHistory,
  };
}
