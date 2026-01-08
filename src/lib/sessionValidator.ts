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

export function validateSessionJson(input: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Erreur de syntaxe';
    errors.push({ 
      path: '', 
      message: `JSON invalide : ${errorMessage}` 
    });
    return { valid: false, errors, session: null };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    errors.push({ path: '', message: `Le JSON doit être un objet` });
    return { valid: false, errors, session: null };
  }

  const obj = parsed as Record<string, unknown>;

  // Validate session metadata
  if (!obj.session) {
    errors.push({ path: 'session', message: `Le champ 'session' est manquant` });
  } else {
    validateSessionMetadata(obj.session, errors);
  }

  // Validate blocks
  if (!obj.blocks) {
    errors.push({ path: 'blocks', message: `Le champ 'blocks' est manquant` });
  } else if (!Array.isArray(obj.blocks)) {
    errors.push({ path: 'blocks', message: `Le champ 'blocks' doit être un tableau` });
  } else if (obj.blocks.length === 0) {
    errors.push({ path: 'blocks', message: `La séance doit contenir au moins un bloc` });
  } else {
    obj.blocks.forEach((block, idx) => {
      validateBlock(block, `blocks[${idx}]`, errors);
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors, session: null };
  }

  return { 
    valid: true, 
    errors: [], 
    session: parsed as JsonSession 
  };
}
