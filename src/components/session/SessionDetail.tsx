import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Play, Clock, Target, Activity, Dumbbell, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { StoredSession, Block, Exercise } from '@/types/jsonSession';
import {
  SESSION_TYPE_FR,
  DOMINANT_FOCUS_FR,
  BLOCK_TYPE_FR,
  MOVEMENT_PATTERN_FR,
  BODY_REGION_FR,
  EXECUTION_TYPE_FR,
  EQUIPMENT_FR,
  formatRange,
  getNumericValue,
} from '@/types/jsonSession';

interface SessionDetailProps {
  session: StoredSession;
  onBack: () => void;
  onStart: () => void;
}

function ExerciseDetail({ exercise, index }: { exercise: Exercise; index: number }) {
  const sets = getNumericValue(exercise.sets);
  const reps = formatRange(exercise.reps);
  const repsPerSide = formatRange(exercise.reps_per_side);
  const duration = formatRange(exercise.duration_sec, 's');
  const isometricHold = formatRange(exercise.isometric_hold_sec, 's');
  const restAfterSet = formatRange(exercise.rest_after_set_sec, 's');
  const rir = formatRange(exercise.rir);

  return (
    <div className="p-4 bg-secondary/50 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground">{exercise.exercise_name}</h4>
          
          {/* Movement pattern & body region */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {exercise.movement_pattern && (
              <Badge variant="outline" className="text-xs">
                {MOVEMENT_PATTERN_FR[exercise.movement_pattern]}
              </Badge>
            )}
            {exercise.body_region && (
              <Badge variant="outline" className="text-xs">
                {BODY_REGION_FR[exercise.body_region]}
              </Badge>
            )}
            {exercise.execution_type && exercise.execution_type !== 'standard' && (
              <Badge variant="secondary" className="text-xs">
                {EXECUTION_TYPE_FR[exercise.execution_type]}
              </Badge>
            )}
          </div>

          {/* Main metrics */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
            {sets && (
              <span className="text-foreground">
                <span className="text-muted-foreground">Séries:</span> {sets}
              </span>
            )}
            {reps && (
              <span className="text-foreground">
                <span className="text-muted-foreground">Reps:</span> {reps}
              </span>
            )}
            {repsPerSide && (
              <span className="text-foreground">
                <span className="text-muted-foreground">Reps/côté:</span> {repsPerSide}
              </span>
            )}
            {duration && (
              <span className="text-foreground">
                <span className="text-muted-foreground">Durée:</span> {duration}
              </span>
            )}
            {isometricHold && (
              <span className="text-foreground">
                <span className="text-muted-foreground">Maintien:</span> {isometricHold}
              </span>
            )}
            {rir && (
              <span className="text-foreground">
                <span className="text-muted-foreground">RIR:</span> {rir}
              </span>
            )}
            {exercise.tempo && (
              <span className="text-foreground">
                <span className="text-muted-foreground">Tempo:</span> {exercise.tempo}
              </span>
            )}
            {restAfterSet && (
              <span className="text-foreground">
                <span className="text-muted-foreground">Repos:</span> {restAfterSet}
              </span>
            )}
            {exercise.target_weight != null && (
              <span className="text-foreground font-medium">
                <span className="text-muted-foreground">Poids cible:</span>{' '}
                <span className="text-primary">{exercise.target_weight} kg</span>
              </span>
            )}
          </div>

          {/* Equipment */}
          {exercise.equipment && exercise.equipment.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {exercise.equipment.map((eq) => (
                <Badge key={eq} variant="outline" className="text-xs bg-background">
                  <Dumbbell className="w-3 h-3 mr-1" />
                  {EQUIPMENT_FR[eq]}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {exercise.description && (
            <p className="text-sm text-muted-foreground mt-3 italic">
              {exercise.description}
            </p>
          )}

          {/* Coaching cues */}
          {exercise.coaching_cues && exercise.coaching_cues.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Info className="w-3 h-3" />
                Consignes
              </div>
              <ul className="text-sm text-foreground space-y-0.5">
                {exercise.coaching_cues.map((cue, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety notes */}
          {exercise.safety_notes && exercise.safety_notes.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs text-destructive/80 mb-1">
                <AlertTriangle className="w-3 h-3" />
                Sécurité
              </div>
              <ul className="text-sm text-foreground space-y-0.5">
                {exercise.safety_notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockDetail({ block, index }: { block: Block; index: number }) {
  const rounds = getNumericValue(block.rounds);
  const restBetweenExercises = formatRange(block.rest_between_exercises_sec, 's');
  const restBetweenRounds = formatRange(block.rest_between_rounds_sec, 's');
  const duration = formatRange(block.duration_sec, 's');
  const launchTimer = block.block_type === 'circuit' ? (block.launch_timer_sec ?? 15) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{index + 1}</span>
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{block.block_name}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="secondary">
                {BLOCK_TYPE_FR[block.block_type]}
              </Badge>
              {rounds && rounds > 1 && (
                <Badge variant="outline">{rounds} tours</Badge>
              )}
              {duration && (
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {duration}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {block.block_description && (
          <p className="text-sm text-muted-foreground italic">
            {block.block_description}
          </p>
        )}

        {/* Block timing info */}
        {(launchTimer || restBetweenExercises || restBetweenRounds) && (
          <div className="flex flex-wrap gap-3 text-sm">
            {launchTimer !== null && launchTimer > 0 && (
              <span className="text-muted-foreground">
                Timer de lancement: <span className="text-foreground">{launchTimer}s</span>
              </span>
            )}
            {restBetweenExercises && (
              <span className="text-muted-foreground">
                Repos entre exercices: <span className="text-foreground">{restBetweenExercises}</span>
              </span>
            )}
            {restBetweenRounds && (
              <span className="text-muted-foreground">
                Repos entre tours: <span className="text-foreground">{restBetweenRounds}</span>
              </span>
            )}
          </div>
        )}

        {/* Exercises */}
        <div className="space-y-3">
          {block.exercises.map((exercise, idx) => (
            <ExerciseDetail key={exercise.exercise_id} exercise={exercise} index={idx} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SessionDetail({ session, onBack, onStart }: SessionDetailProps) {
  const { session: meta, blocks } = session;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {meta.session_name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {meta.estimated_duration_min} min
            </div>
          </div>
          <Button variant="default" size="sm" onClick={onStart}>
            <Play className="w-4 h-4 mr-1" />
            Lancer
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 pb-24">
          {/* Session meta */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Activity className="w-3 h-3 mr-1" />
                  {SESSION_TYPE_FR[meta.session_type]}
                </Badge>
                <Badge className="bg-accent/10 text-accent border-accent/20">
                  <Target className="w-3 h-3 mr-1" />
                  {DOMINANT_FOCUS_FR[meta.dominant_focus]}
                </Badge>
              </div>

              {meta.global_notes && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground">
                    {meta.global_notes}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Blocks */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Blocs ({blocks.length})
            </h2>
            {blocks.map((block, idx) => (
              <BlockDetail key={block.block_id} block={block} index={idx} />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
        <Button variant="default" size="lg" onClick={onStart} className="w-full">
          <Play className="w-5 h-5 mr-2" />
          Lancer la séance
        </Button>
      </div>
    </motion.div>
  );
}
