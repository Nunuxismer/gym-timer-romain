import { TimerPreset, GlobalSettings, DEFAULT_SETTINGS } from '@/types/timer';

const PRESETS_KEY = 'gym-timer-presets';
const SETTINGS_KEY = 'gym-timer-settings';

export function loadPresets(): TimerPreset[] {
  try {
    const data = localStorage.getItem(PRESETS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function savePresets(presets: TimerPreset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function loadSettings(): GlobalSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GlobalSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportPreset(preset: TimerPreset): string {
  return JSON.stringify(preset, null, 2);
}

export function importPreset(json: string): TimerPreset | null {
  try {
    const preset = JSON.parse(json);
    // Validate required fields
    if (
      typeof preset.name !== 'string' ||
      typeof preset.preparationSeconds !== 'number' ||
      typeof preset.activitySeconds !== 'number' ||
      typeof preset.restSeconds !== 'number' ||
      typeof preset.cycles !== 'number'
    ) {
      return null;
    }
    return preset as TimerPreset;
  } catch {
    return null;
  }
}
