import { useState, useEffect, useCallback } from 'react';
import { GlobalSettings, DEFAULT_SETTINGS } from '@/types/timer';
import { loadSettings, saveSettings } from '@/lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setIsLoaded(true);
    applyTheme(loaded.theme);
  }, []);

  const applyTheme = (theme: GlobalSettings['theme']) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'gym-mode');
    
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'gym') {
      root.classList.add('gym-mode');
    }
    // dark is the default (no class needed due to CSS setup)
  };

  const updateSettings = useCallback((updates: Partial<GlobalSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    if (updates.theme) {
      applyTheme(updates.theme);
    }
  }, [settings]);

  return {
    settings,
    isLoaded,
    updateSettings,
  };
}
