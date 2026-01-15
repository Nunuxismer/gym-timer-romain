import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { JsonSession } from '@/types/jsonSession';
import type { Json } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { sessionNameSchema } from '@/lib/validation';
export interface SavedSession {
  id: string;
  user_id: string;
  session_data: JsonSession;
  name: string;
  created_at: string;
  updated_at: string;
}

function jsonToSession(json: Json): JsonSession {
  return json as unknown as JsonSession;
}

function sessionToJson(session: JsonSession): Json {
  return session as unknown as Json;
}

export function useSavedSessions() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const typedData: SavedSession[] = (data || []).map(item => ({
        ...item,
        session_data: jsonToSession(item.session_data)
      }));
      
      setSessions(typedData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les séances',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const addSession = useCallback(async (jsonSession: JsonSession): Promise<SavedSession | null> => {
    if (!user) return null;

    // Validate session name
    const nameValidation = sessionNameSchema.safeParse(jsonSession.session.session_name);
    if (!nameValidation.success) {
      toast({
        title: 'Erreur de validation',
        description: nameValidation.error.errors.map(e => e.message).join(', '),
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('saved_sessions')
        .insert({
          user_id: user.id,
          session_data: sessionToJson(jsonSession),
          name: nameValidation.data,
        })
        .select()
        .single();

      if (error) throw error;
      
      const typedData: SavedSession = {
        ...data,
        session_data: jsonToSession(data.session_data)
      };
      
      setSessions(prev => [typedData, ...prev]);
      return typedData;
    } catch (error) {
      console.error('Error adding session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la séance',
        variant: 'destructive',
      });
      return null;
    }
  }, [user]);

  const updateSession = useCallback(async (id: string, jsonSession: JsonSession): Promise<SavedSession | null> => {
    if (!user) return null;

    // Validate session name
    const nameValidation = sessionNameSchema.safeParse(jsonSession.session.session_name);
    if (!nameValidation.success) {
      toast({
        title: 'Erreur de validation',
        description: nameValidation.error.errors.map(e => e.message).join(', '),
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('saved_sessions')
        .update({
          session_data: sessionToJson(jsonSession),
          name: nameValidation.data,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      const typedData: SavedSession = {
        ...data,
        session_data: jsonToSession(data.session_data)
      };
      
      setSessions(prev => prev.map(s => s.id === id ? typedData : s));
      return typedData;
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la séance',
        variant: 'destructive',
      });
      return null;
    }
  }, [user]);

  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la séance',
        variant: 'destructive',
      });
      return false;
    }
  }, [user]);

  const getSession = useCallback((id: string): SavedSession | undefined => {
    return sessions.find(s => s.id === id);
  }, [sessions]);

  return {
    sessions,
    loading,
    addSession,
    updateSession,
    deleteSession,
    getSession,
    refetch: fetchSessions,
  };
}
