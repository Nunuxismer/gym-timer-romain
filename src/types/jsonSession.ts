// JSON Session Schema Types
// Based on the canonical structure provided

// Range type for numeric fields that can be either a simple number or a range
export interface NumberRange {
  min: number;
  max: number;
}

export type RangeOrNumber = number | NumberRange;

// Helper to get the value from a RangeOrNumber (uses min if range)
export function getNumericValue(value: RangeOrNumber | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  return value.min;
}

// Helper to format a range for display
export function formatRange(value: RangeOrNumber | null | undefined, suffix: string = ''): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return `${value}${suffix}`;
  return `${value.min}–${value.max}${suffix}`;
}

// Session types
export type SessionType = 'full_body' | 'upper' | 'lower' | 'cardio' | 'mobility';
export type DominantFocus = 'posture' | 'strength' | 'cardio' | 'core' | 'recovery';
export type IntensityModel = 'RIR' | 'RPE' | 'percentage';

// Block types
export type BlockType = 'activation' | 'standard' | 'circuit' | 'cardio';

// Exercise types
export type MovementPattern = 
  | 'horizontal_pull' 
  | 'vertical_pull' 
  | 'horizontal_push'
  | 'vertical_push'
  | 'push' 
  | 'squat' 
  | 'hinge' 
  | 'lunge' 
  | 'core' 
  | 'carry' 
  | 'cardio';

export type BodyRegion = 'upper' | 'lower' | 'core' | 'full';

export type ExecutionType = 'standard' | 'isometric' | 'timed_hold' | 'isometric_reps' | 'free';

export type Equipment = 
  | 'barbell' 
  | 'dumbbell' 
  | 'kettlebell' 
  | 'cable' 
  | 'band' 
  | 'bodyweight' 
  | 'machine';

// Exercise interface
export interface Exercise {
  exercise_id: string;
  exercise_name: string;
  description?: string | null;
  movement_pattern?: MovementPattern | null;
  body_region?: BodyRegion | null;
  execution_type?: ExecutionType | null;
  equipment?: Equipment[] | null;
  exercise_variants?: string[] | null;
  sets?: RangeOrNumber | null;
  reps?: RangeOrNumber | null;
  reps_per_side?: RangeOrNumber | null;
  duration_sec?: RangeOrNumber | null;
  tempo?: string | null;
  isometric_hold_sec?: RangeOrNumber | null;
  eccentric_sec?: RangeOrNumber | null;
  rir?: RangeOrNumber | null;
  estimated_tut_sec?: RangeOrNumber | null;
  rest_after_set_sec?: RangeOrNumber | null;
  coaching_cues?: string[] | null;
  safety_notes?: string[] | null;
  stop_conditions?: string[] | null;
  bilateral?: boolean; // If true, timed exercise runs twice (left side, then right side)
}

// Block interface
export interface Block {
  block_id: string;
  block_type: BlockType;
  block_name: string;
  block_description?: string | null;
  rounds?: RangeOrNumber | null;
  rest_between_exercises_sec?: RangeOrNumber | null;
  rest_between_rounds_sec?: RangeOrNumber | null;
  duration_sec?: RangeOrNumber | null;
  exercises: Exercise[];
}

// Session metadata interface
export interface SessionMetadata {
  session_id: string;
  session_name: string;
  session_type: SessionType;
  dominant_focus: DominantFocus;
  estimated_duration_min: number;
  intensity_model?: IntensityModel | null;
  global_notes?: string | null;
}

// Full session interface
export interface JsonSession {
  session: SessionMetadata;
  blocks: Block[];
}

// Stored session (with app metadata)
export interface StoredSession extends JsonSession {
  storedAt: string;
  lastRunAt?: string | null;
}

// French translations for display
export const SESSION_TYPE_FR: Record<SessionType, string> = {
  full_body: 'Full body',
  upper: 'Haut du corps',
  lower: 'Bas du corps',
  cardio: 'Cardio',
  mobility: 'Mobilité',
};

export const DOMINANT_FOCUS_FR: Record<DominantFocus, string> = {
  posture: 'Posture',
  strength: 'Force',
  cardio: 'Cardio',
  core: 'Gainage',
  recovery: 'Récupération',
};

export const BLOCK_TYPE_FR: Record<BlockType, string> = {
  activation: 'Activation',
  standard: 'Standard',
  circuit: 'Circuit',
  cardio: 'Cardio',
};

export const MOVEMENT_PATTERN_FR: Record<MovementPattern, string> = {
  horizontal_pull: 'Tirage horizontal',
  vertical_pull: 'Tirage vertical',
  horizontal_push: 'Poussée horizontale',
  vertical_push: 'Poussée verticale',
  push: 'Poussée',
  squat: 'Squat',
  hinge: 'Hip hinge',
  lunge: 'Fente',
  core: 'Gainage',
  carry: 'Portage',
  cardio: 'Cardio',
};

export const BODY_REGION_FR: Record<BodyRegion, string> = {
  upper: 'Haut du corps',
  lower: 'Bas du corps',
  core: 'Tronc',
  full: 'Corps entier',
};

export const EXECUTION_TYPE_FR: Record<ExecutionType, string> = {
  standard: 'Standard',
  isometric: 'Isométrique',
  timed_hold: 'Maintien chronométré',
  isometric_reps: 'Répétitions isométriques',
  free: 'Libre',
};

export const EQUIPMENT_FR: Record<Equipment, string> = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  kettlebell: 'Kettlebell',
  cable: 'Câble',
  band: 'Élastique',
  bodyweight: 'Poids du corps',
  machine: 'Machine',
};
