import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TimerPreset, DEFAULT_PRESET } from '@/types/timer';
import { loadPresets, savePresets } from '@/lib/storage';

export function usePresets() {
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPresets(loadPresets());
    setIsLoaded(true);
  }, []);

  const saveAll = useCallback((newPresets: TimerPreset[]) => {
    setPresets(newPresets);
    savePresets(newPresets);
  }, []);

  const addPreset = useCallback((data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>): TimerPreset => {
    const now = Date.now();
    const newPreset: TimerPreset = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...presets, newPreset];
    saveAll(updated);
    return newPreset;
  }, [presets, saveAll]);

  const updatePreset = useCallback((id: string, data: Partial<TimerPreset>): void => {
    const updated = presets.map(p =>
      p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p
    );
    saveAll(updated);
  }, [presets, saveAll]);

  const deletePreset = useCallback((id: string): void => {
    const updated = presets.filter(p => p.id !== id);
    saveAll(updated);
  }, [presets, saveAll]);

  const duplicatePreset = useCallback((id: string): TimerPreset | null => {
    const original = presets.find(p => p.id === id);
    if (!original) return null;

    const now = Date.now();
    const duplicate: TimerPreset = {
      ...original,
      id: uuidv4(),
      name: `${original.name} (copie)`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...presets, duplicate];
    saveAll(updated);
    return duplicate;
  }, [presets, saveAll]);

  const getPreset = useCallback((id: string): TimerPreset | undefined => {
    return presets.find(p => p.id === id);
  }, [presets]);

  const importPresetFromJson = useCallback((preset: TimerPreset): TimerPreset => {
    const now = Date.now();
    const imported: TimerPreset = {
      ...preset,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...presets, imported];
    saveAll(updated);
    return imported;
  }, [presets, saveAll]);

  return {
    presets,
    isLoaded,
    addPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
    getPreset,
    importPresetFromJson,
  };
}
