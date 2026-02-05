// Training Cycle Types for recurring weekly schedules

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday, 6 = Sunday

export const DAY_NAMES_FR: Record<DayOfWeek, string> = {
  0: 'Lundi',
  1: 'Mardi',
  2: 'Mercredi',
  3: 'Jeudi',
  4: 'Vendredi',
  5: 'Samedi',
  6: 'Dimanche',
};

export const DAY_NAMES_SHORT_FR: Record<DayOfWeek, string> = {
  0: 'Lun',
  1: 'Mar',
  2: 'Mer',
  3: 'Jeu',
  4: 'Ven',
  5: 'Sam',
  6: 'Dim',
};

export interface WeeklySlot {
  dayOfWeek: DayOfWeek;
  sessionId: string; // saved_session_id or local:session_id
  sessionName: string;
  isLocal?: boolean;
}

export interface TrainingCycleConfig {
  name: string;
  weeklySchedule: WeeklySlot[];
  numberOfWeeks: number;
  startDate: Date;
}

// JSON format for AI-generated cycles
export interface TrainingCycleJson {
  cycle_name: string;
  start_date: string; // ISO format YYYY-MM-DD
  number_of_weeks: number;
  weekly_schedule: Array<{
    day_of_week: number; // 0 = Monday, 6 = Sunday
    session_id: string;
    session_name: string;
  }>;
}
