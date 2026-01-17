import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { notesSchema } from '@/lib/validation';
export interface ScheduledSession {
  id: string;
  user_id: string;
  saved_session_id: string | null;
  scheduled_date: string;
  notes: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useScheduledSessions() {
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchScheduledSessions = useCallback(async () => {
    if (!user) {
      setScheduledSessions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setScheduledSessions(data || []);
    } catch (error) {
      console.error('Error fetching scheduled sessions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le planning',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScheduledSessions();
  }, [fetchScheduledSessions]);

  const scheduleSession = useCallback(async (
    savedSessionId: string,
    date: Date,
    notes?: string
  ): Promise<ScheduledSession | null> => {
    if (!user) return null;

    // Validate notes if provided
    if (notes !== undefined) {
      const notesValidation = notesSchema.safeParse(notes);
      if (!notesValidation.success) {
        toast({
          title: 'Erreur de validation',
          description: notesValidation.error.errors.map(e => e.message).join(', '),
          variant: 'destructive',
        });
        return null;
      }
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .insert({
          user_id: user.id,
          saved_session_id: savedSessionId,
          scheduled_date: format(date, 'yyyy-MM-dd'),
          notes: notes?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setScheduledSessions(prev => [...prev, data].sort(
        (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      ));
      return data;
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de planifier la séance',
        variant: 'destructive',
      });
      return null;
    }
  }, [user]);

  const updateScheduledSession = useCallback(async (
    id: string,
    updates: Partial<Pick<ScheduledSession, 'scheduled_date' | 'notes' | 'completed'>>
  ): Promise<ScheduledSession | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setScheduledSessions(prev => prev.map(s => s.id === id ? data : s));
      return data;
    } catch (error) {
      console.error('Error updating scheduled session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la planification',
        variant: 'destructive',
      });
      return null;
    }
  }, [user]);

  const deleteScheduledSession = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('scheduled_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setScheduledSessions(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting scheduled session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la planification',
        variant: 'destructive',
      });
      return false;
    }
  }, [user]);

  const getSessionsForDate = useCallback((date: Date): ScheduledSession[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduledSessions.filter(s => s.scheduled_date === dateStr);
  }, [scheduledSessions]);

  const getUpcomingSessions = useCallback((limit: number = 5): ScheduledSession[] => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return scheduledSessions
      .filter(s => s.scheduled_date >= today && !s.completed)
      .slice(0, limit);
  }, [scheduledSessions]);

  return {
    scheduledSessions,
    loading,
    scheduleSession,
    updateScheduledSession,
    deleteScheduledSession,
    getSessionsForDate,
    getUpcomingSessions,
    refetch: fetchScheduledSessions,
  };
}
