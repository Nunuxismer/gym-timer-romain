export type ActivityMode = 'countdown' | 'countup';

export interface TimerPreset {
  id: string;
  name: string;
  preparationSeconds: number;
  activitySeconds: number;
  activityMode: ActivityMode;
  restSeconds: number;
  cycles: number;
  beepLastThree: boolean;
  voiceAnnounce: boolean;
  soundSet: 'beep' | 'bell';
  volume: number;
  createdAt: number;
  updatedAt: number;
}

export type TimerPhase = 'idle' | 'preparation' | 'activity' | 'rest' | 'complete';

export interface TimerState {
  phase: TimerPhase;
  currentCycle: number;
  totalCycles: number;
  timeRemaining: number;
  timeElapsed: number;
  phaseDuration: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface GlobalSettings {
  defaultBeepLastThree: boolean;
  defaultVoiceAnnounce: boolean;
  defaultSoundSet: 'beep' | 'bell';
  defaultVolume: number;
  theme: 'dark' | 'light' | 'gym';
  hapticFeedback: boolean;
}

export const DEFAULT_PRESET: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  preparationSeconds: 10,
  activitySeconds: 30,
  activityMode: 'countdown',
  restSeconds: 15,
  cycles: 8,
  beepLastThree: true,
  voiceAnnounce: true,
  soundSet: 'beep',
  volume: 0.8,
};

export const DEFAULT_SETTINGS: GlobalSettings = {
  defaultBeepLastThree: true,
  defaultVoiceAnnounce: true,
  defaultSoundSet: 'beep',
  defaultVolume: 0.8,
  theme: 'dark',
  hapticFeedback: true,
};
