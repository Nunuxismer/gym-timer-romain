import { useState, useCallback, useEffect } from 'react';
import type { JsonSession, StoredSession } from '@/types/jsonSession';
import { validateSessionJson } from '@/lib/sessionValidator';

const STORAGE_KEY = 'gym-timer-json-sessions';

function loadSessionsFromStorage(): StoredSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveSessionsToStorage(sessions: StoredSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useJsonSessions() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    setSessions(loadSessionsFromStorage());
    setIsLoaded(true);
  }, []);

  // Save when sessions change
  useEffect(() => {
    if (isLoaded) {
      saveSessionsToStorage(sessions);
    }
  }, [sessions, isLoaded]);

  const addSession = useCallback((jsonSession: JsonSession): StoredSession => {
    const stored: StoredSession = {
      ...jsonSession,
      storedAt: new Date().toISOString(),
      lastRunAt: null,
    };

    setSessions(prev => {
      // Check if session with same ID exists
      const existingIdx = prev.findIndex(s => s.session.session_id === jsonSession.session.session_id);
      if (existingIdx !== -1) {
        // Replace existing
        const updated = [...prev];
        updated[existingIdx] = stored;
        return updated;
      }
      return [...prev, stored];
    });

    return stored;
  }, []);

  const updateSession = useCallback((sessionId: string, jsonSession: JsonSession): StoredSession | null => {
    let updated: StoredSession | null = null;

    setSessions(prev => {
      const idx = prev.findIndex(s => s.session.session_id === sessionId);
      if (idx === -1) return prev;

      updated = {
        ...jsonSession,
        storedAt: prev[idx].storedAt,
        lastRunAt: prev[idx].lastRunAt,
      };

      const newSessions = [...prev];
      newSessions[idx] = updated;
      return newSessions;
    });

    return updated;
  }, []);

  const deleteSession = useCallback((sessionId: string): void => {
    setSessions(prev => prev.filter(s => s.session.session_id !== sessionId));
  }, []);

  const getSession = useCallback((sessionId: string): StoredSession | undefined => {
    return sessions.find(s => s.session.session_id === sessionId);
  }, [sessions]);

  const markSessionRun = useCallback((sessionId: string): void => {
    setSessions(prev => {
      const idx = prev.findIndex(s => s.session.session_id === sessionId);
      if (idx === -1) return prev;

      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        lastRunAt: new Date().toISOString(),
      };
      return updated;
    });
  }, []);

  const importFromJson = useCallback((jsonString: string): { success: boolean; errors: string[]; session?: StoredSession } => {
    const result = validateSessionJson(jsonString);
    
    if (!result.valid || !result.session) {
      return {
        success: false,
        errors: result.errors.map(e => e.path ? `${e.path}: ${e.message}` : e.message),
      };
    }

    const stored = addSession(result.session);
    return {
      success: true,
      errors: [],
      session: stored,
    };
  }, [addSession]);

  return {
    sessions,
    isLoaded,
    addSession,
    updateSession,
    deleteSession,
    getSession,
    markSessionRun,
    importFromJson,
  };
}
