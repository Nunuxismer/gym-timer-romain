// JSON Session Validator with French error messages

import type { 
  JsonSession, 
  SessionMetadata, 
  Block, 
  Exercise,
  SessionType,
  DominantFocus,
  BlockType,
  RangeOrNumber
} from '@/types/jsonSession';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  session: JsonSession | null;
}

const SESSION_TYPES: SessionType[] = ['full_body', 'upper', 'lower', 'cardio', 'mobility'];
const DOMINANT_FOCUS_VALUES: DominantFocus[] = ['posture', 'strength', 'cardio', 'core', 'recovery'];
const BLOCK_TYPES: BlockType[] = ['activation', 'standard', 'circuit', 'cardio'];

function isValidRangeOrNumber(value: unknown): value is RangeOrNumber {
  if (typeof value === 'number') return true;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    return typeof obj.min === 'number' && typeof obj.max === 'number';
  }
  return false;
}

function validateRangeOrNumber(value: unknown, path: string, fieldName: string, errors: ValidationError[]): boolean {
  if (value === null || value === undefined) return true; // Optional field
  if (!isValidRangeOrNumber(value)) {
    errors.push({
      path,
      message: `Le champ '${fieldName}' doit être un nombre ou un objet { min, max }`
    });
    return false;
  }
  return true;
}

function validateExercise(exercise: unknown, path: string, errors: ValidationError[]): exercise is Exercise {
  if (typeof exercise !== 'object' || exercise === null) {
    errors.push({ path, message: `L'exercice doit être un objet` });
    return false;
  }

  const ex = exercise as Record<string, unknown>;
  let valid = true;

  // Required fields
  if (typeof ex.exercise_id !== 'string' || !ex.exercise_id) {
    errors.push({ path: `${path}.exercise_id`, message: `Le champ 'exercise_id' est obligatoire` });
    valid = false;
  }

  if (typeof ex.exercise_name !== 'string' || !ex.exercise_name) {
    errors.push({ path: `${path}.exercise_name`, message: `Le champ 'exercise_name' est obligatoire` });
    valid = false;
  }

  // Optional range fields
  const rangeFields = [
    'sets', 'reps', 'reps_per_side', 'duration_sec', 
    'isometric_hold_sec', 'eccentric_sec', 'rir', 
    'estimated_tut_sec', 'rest_after_set_sec'
  ];

  for (const field of rangeFields) {
    if (ex[field] !== undefined && ex[field] !== null) {
      validateRangeOrNumber(ex[field], `${path}.${field}`, field, errors);
    }
  }

  // Optional arrays
  if (ex.coaching_cues !== undefined && ex.coaching_cues !== null) {
    if (!Array.isArray(ex.coaching_cues)) {
      errors.push({ path: `${path}.coaching_cues`, message: `Le champ 'coaching_cues' doit être un tableau` });
    }
  }

  if (ex.safety_notes !== undefined && ex.safety_notes !== null) {
    if (!Array.isArray(ex.safety_notes)) {
      errors.push({ path: `${path}.safety_notes`, message: `Le champ 'safety_notes' doit être un tableau` });
    }
  }

  if (ex.equipment !== undefined && ex.equipment !== null) {
    if (!Array.isArray(ex.equipment)) {
      errors.push({ path: `${path}.equipment`, message: `Le champ 'equipment' doit être un tableau` });
    }
  }

  return valid;
}

function validateBlock(block: unknown, path: string, errors: ValidationError[]): block is Block {
  if (typeof block !== 'object' || block === null) {
    errors.push({ path, message: `Le bloc doit être un objet` });
    return false;
  }

  const b = block as Record<string, unknown>;
  let valid = true;

  // Required fields
  if (typeof b.block_id !== 'string' || !b.block_id) {
    errors.push({ path: `${path}.block_id`, message: `Le champ 'block_id' est obligatoire` });
    valid = false;
  }

  if (typeof b.block_name !== 'string' || !b.block_name) {
    errors.push({ path: `${path}.block_name`, message: `Le champ 'block_name' est obligatoire` });
    valid = false;
  }

  if (!BLOCK_TYPES.includes(b.block_type as BlockType)) {
    errors.push({ 
      path: `${path}.block_type`, 
      message: `Le champ 'block_type' doit être: ${BLOCK_TYPES.join(', ')}` 
    });
    valid = false;
  }

  // Exercises array
  if (!Array.isArray(b.exercises)) {
    errors.push({ path: `${path}.exercises`, message: `Le champ 'exercises' doit être un tableau` });
    valid = false;
  } else {
    b.exercises.forEach((exercise, idx) => {
      validateExercise(exercise, `${path}.exercises[${idx}]`, errors);
    });
  }

  // Optional range fields
  const rangeFields = ['rounds', 'rest_between_exercises_sec', 'rest_between_rounds_sec', 'duration_sec'];
  for (const field of rangeFields) {
    if (b[field] !== undefined && b[field] !== null) {
      validateRangeOrNumber(b[field], `${path}.${field}`, field, errors);
    }
  }

  if (b.launch_timer_sec !== undefined && b.launch_timer_sec !== null && typeof b.launch_timer_sec !== 'number') {
    errors.push({
      path: `${path}.launch_timer_sec`,
      message: `Le champ 'launch_timer_sec' doit être un nombre`
    });
  }

  return valid;
}

function validateSessionMetadata(session: unknown, errors: ValidationError[]): session is SessionMetadata {
  if (typeof session !== 'object' || session === null) {
    errors.push({ path: 'session', message: `Le champ 'session' doit être un objet` });
    return false;
  }

  const s = session as Record<string, unknown>;
  let valid = true;

  // Required fields
  if (typeof s.session_id !== 'string' || !s.session_id) {
    errors.push({ path: 'session.session_id', message: `Le champ 'session_id' est obligatoire` });
    valid = false;
  }

  if (typeof s.session_name !== 'string' || !s.session_name) {
    errors.push({ path: 'session.session_name', message: `Le champ 'session_name' est obligatoire` });
    valid = false;
  }

  if (!SESSION_TYPES.includes(s.session_type as SessionType)) {
    errors.push({ 
      path: 'session.session_type', 
      message: `Le champ 'session_type' doit être: ${SESSION_TYPES.join(', ')}` 
    });
    valid = false;
  }

  if (!DOMINANT_FOCUS_VALUES.includes(s.dominant_focus as DominantFocus)) {
    errors.push({ 
      path: 'session.dominant_focus', 
      message: `Le champ 'dominant_focus' doit être: ${DOMINANT_FOCUS_VALUES.join(', ')}` 
    });
    valid = false;
  }

  if (typeof s.estimated_duration_min !== 'number') {
    errors.push({ 
      path: 'session.estimated_duration_min', 
      message: `Le champ 'estimated_duration_min' doit être un nombre` 
    });
    valid = false;
  }

  return valid;
}

// Validate a single session object (with session + blocks)
function validateSingleSession(obj: Record<string, unknown>, errors: ValidationError[], prefix: string = ''): boolean {
  let valid = true;
  const p = prefix ? `${prefix}.` : '';

  if (!obj.session) {
    errors.push({ path: `${p}session`, message: `Le champ 'session' est manquant` });
    valid = false;
  } else {
    if (!validateSessionMetadata(obj.session, errors)) valid = false;
  }

  if (!obj.blocks) {
    errors.push({ path: `${p}blocks`, message: `Le champ 'blocks' est manquant` });
    valid = false;
  } else if (!Array.isArray(obj.blocks)) {
    errors.push({ path: `${p}blocks`, message: `Le champ 'blocks' doit être un tableau` });
    valid = false;
  } else if (obj.blocks.length === 0) {
    errors.push({ path: `${p}blocks`, message: `La séance doit contenir au moins un bloc` });
    valid = false;
  } else {
    obj.blocks.forEach((block, idx) => {
      validateBlock(block, `${p}blocks[${idx}]`, errors);
    });
  }

  return valid;
}

export interface CycleValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sessions: JsonSession[];
  cycle: {
    cycle_name: string;
    start_date: string;
    number_of_weeks: number;
    weekly_schedule: Array<{
      day_of_week: number;
      session_id: string;
      session_name: string;
    }>;
  } | null;
}

// Detect if the JSON is a combined format { sessions[], cycle }
export function isCombinedFormat(input: string): boolean {
  try {
    const parsed = JSON.parse(input);
    return typeof parsed === 'object' && parsed !== null && Array.isArray(parsed.sessions);
  } catch {
    return false;
  }
}

export function validateCombinedJson(input: string): CycleValidationResult {
  const errors: ValidationError[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Erreur de syntaxe';
    errors.push({ path: '', message: `JSON invalide : ${errorMessage}` });
    return { valid: false, errors, sessions: [], cycle: null };
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.sessions) || obj.sessions.length === 0) {
    errors.push({ path: 'sessions', message: `Le champ 'sessions' doit être un tableau non vide` });
    return { valid: false, errors, sessions: [], cycle: null };
  }

  // Validate each session
  obj.sessions.forEach((s: unknown, idx: number) => {
    if (typeof s !== 'object' || s === null) {
      errors.push({ path: `sessions[${idx}]`, message: `La séance doit être un objet` });
    } else {
      validateSingleSession(s as Record<string, unknown>, errors, `sessions[${idx}]`);
    }
  });

  // Validate cycle if present
  let cycle = null;
  if (obj.cycle) {
    const c = obj.cycle as Record<string, unknown>;
    if (typeof c.cycle_name !== 'string') {
      errors.push({ path: 'cycle.cycle_name', message: `Le champ 'cycle_name' est obligatoire` });
    }
    if (typeof c.start_date !== 'string') {
      errors.push({ path: 'cycle.start_date', message: `Le champ 'start_date' est obligatoire (format YYYY-MM-DD)` });
    }
    if (typeof c.number_of_weeks !== 'number') {
      errors.push({ path: 'cycle.number_of_weeks', message: `Le champ 'number_of_weeks' doit être un nombre` });
    }
    if (!Array.isArray(c.weekly_schedule)) {
      errors.push({ path: 'cycle.weekly_schedule', message: `Le champ 'weekly_schedule' doit être un tableau` });
    }

    if (errors.length === 0) {
      cycle = c as CycleValidationResult['cycle'];
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, sessions: [], cycle: null };
  }

  return {
    valid: true,
    errors: [],
    sessions: obj.sessions as JsonSession[],
    cycle,
  };
}

export function validateSessionJson(input: string): ValidationResult {
  const errors: ValidationError[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Erreur de syntaxe';
    errors.push({ path: '', message: `JSON invalide : ${errorMessage}` });
    return { valid: false, errors, session: null };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    errors.push({ path: '', message: `Le JSON doit être un objet` });
    return { valid: false, errors, session: null };
  }

  const obj = parsed as Record<string, unknown>;

  validateSingleSession(obj, errors);

  if (errors.length > 0) {
    return { valid: false, errors, session: null };
  }

  return { valid: true, errors: [], session: parsed as JsonSession };
}
