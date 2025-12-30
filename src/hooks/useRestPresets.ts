import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RestTimerPreset, DEFAULT_REST_PRESET } from '@/types/restTimer';

const STORAGE_KEY = 'gym-rest-timer-presets';

function loadRestPresets(): RestTimerPreset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRestPresets(presets: RestTimerPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function useRestPresets() {
  const [presets, setPresets] = useState<RestTimerPreset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPresets(loadRestPresets());
    setIsLoaded(true);
  }, []);

  const saveAll = useCallback((newPresets: RestTimerPreset[]) => {
    setPresets(newPresets);
    saveRestPresets(newPresets);
  }, []);

  const addPreset = useCallback((data: Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'>): RestTimerPreset => {
    const now = Date.now();
    const newPreset: RestTimerPreset = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...presets, newPreset];
    saveAll(updated);
    return newPreset;
  }, [presets, saveAll]);

  const updatePreset = useCallback((id: string, data: Partial<RestTimerPreset>): void => {
    const updated = presets.map(p =>
      p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p
    );
    saveAll(updated);
  }, [presets, saveAll]);

  const deletePreset = useCallback((id: string): void => {
    const updated = presets.filter(p => p.id !== id);
    saveAll(updated);
  }, [presets, saveAll]);

  const getPreset = useCallback((id: string): RestTimerPreset | undefined => {
    return presets.find(p => p.id === id);
  }, [presets]);

  return {
    presets,
    isLoaded,
    addPreset,
    updatePreset,
    deletePreset,
    getPreset,
  };
}
