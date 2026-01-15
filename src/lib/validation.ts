import { z } from 'zod';

// Validation schemas for database operations
// These ensure data integrity before sending to Supabase

// Session name validation
export const sessionNameSchema = z.string()
  .min(1, 'Le nom de la séance est requis')
  .max(200, 'Le nom de la séance ne peut pas dépasser 200 caractères')
  .trim();

// Notes validation (optional)
export const notesSchema = z.string()
  .max(2000, 'Les notes ne peuvent pas dépasser 2000 caractères')
  .trim()
  .optional()
  .nullable();

// Rating validation
export const ratingSchema = z.number()
  .int()
  .min(1, 'La note doit être entre 1 et 5')
  .max(5, 'La note doit être entre 1 et 5')
  .optional()
  .nullable();

// Duration validation
export const durationSecondsSchema = z.number()
  .int()
  .min(0, 'La durée ne peut pas être négative')
  .max(86400, 'La durée ne peut pas dépasser 24 heures'); // Max 24 hours

// Array size limits
const MAX_ARRAY_SIZE = 100;
const MAX_WEIGHT = 1000; // kg
const MAX_REPS = 1000;
const MAX_SETS = 100;

// Reps completed array validation
export const repsCompletedSchema = z.array(
  z.number().int().min(0).max(MAX_REPS)
).max(MAX_ARRAY_SIZE).optional().nullable();

// Weight used array validation
export const weightUsedSchema = z.array(
  z.number().min(0).max(MAX_WEIGHT)
).max(MAX_ARRAY_SIZE).optional().nullable();

// Sets completed validation
export const setsCompletedSchema = z.number()
  .int()
  .min(0)
  .max(MAX_SETS)
  .optional()
  .nullable();

// Exercise name validation
export const exerciseNameSchema = z.string()
  .min(1, 'Le nom de l\'exercice est requis')
  .max(200, 'Le nom de l\'exercice ne peut pas dépasser 200 caractères')
  .trim();

// Exercise ID validation
export const exerciseIdSchema = z.string()
  .min(1)
  .max(100)
  .trim();

// Display name validation
export const displayNameSchema = z.string()
  .max(255, 'Le nom affiché ne peut pas dépasser 255 caractères')
  .trim()
  .optional()
  .nullable();

// Session performance input validation
export const sessionPerformanceInputSchema = z.object({
  savedSessionId: z.string().uuid().optional(),
  scheduledSessionId: z.string().uuid().optional(),
  sessionName: sessionNameSchema,
  sessionData: z.any().optional(), // JSONB - validated by structure
  startedAt: z.date(),
  durationSeconds: durationSecondsSchema,
  notes: notesSchema,
  rating: ratingSchema,
  exerciseLogs: z.array(z.object({
    exerciseId: exerciseIdSchema,
    exerciseName: exerciseNameSchema,
    setsCompleted: setsCompletedSchema,
    repsCompleted: repsCompletedSchema,
    weightUsed: weightUsedSchema,
    notes: notesSchema,
  })).max(MAX_ARRAY_SIZE).optional(),
});

// Saved session validation
export const savedSessionInputSchema = z.object({
  name: sessionNameSchema,
  session_data: z.any(), // JSONB - complex structure
});

// Scheduled session validation
export const scheduledSessionInputSchema = z.object({
  saved_session_id: z.string().uuid().optional().nullable(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  notes: notesSchema,
  completed: z.boolean().optional(),
});

// Helper function to safely validate and return result
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.errors.map(e => e.message).join(', ');
  return { success: false, error: errorMessages };
}
