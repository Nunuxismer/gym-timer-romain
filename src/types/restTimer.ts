export interface RestTimerPreset {
  id: string;
  name: string;
  totalSets: number;
  restSeconds: number;
  createdAt: number;
  updatedAt: number;
}

export interface RestTimerState {
  isRunning: boolean;
  currentSet: number;
  totalSets: number;
  restSeconds: number;
  timeElapsed: number;
  timeRemaining: number;
}

export const DEFAULT_REST_PRESET: Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  totalSets: 5,
  restSeconds: 90,
};
