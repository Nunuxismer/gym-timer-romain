import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, ChevronDown, ChevronUp, Weight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { StoredSession, JsonSession, Block, Exercise, SessionType, DominantFocus, BlockType, RangeOrNumber } from '@/types/jsonSession';
import { SESSION_TYPE_FR, DOMINANT_FOCUS_FR, BLOCK_TYPE_FR, formatRange, getNumericValue } from '@/types/jsonSession';

interface SessionEditFormProps {
  session: StoredSession;
  onSave: (session: JsonSession) => void;
  onBack: () => void;
}

// Helper to parse a range input (e.g., "60-75" or "90")
function parseRangeInput(value: string): RangeOrNumber | null {
  if (!value.trim()) return null;
  
  // Check for range format "min-max"
  if (value.includes('-')) {
    const parts = value.split('-').map(p => parseInt(p.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { min: parts[0], max: parts[1] };
    }
  }
  
  // Single number
  const num = parseInt(value, 10);
  if (!isNaN(num)) return num;
  
  return null;
}

// Helper to convert RangeOrNumber to input string
function rangeToString(value: RangeOrNumber | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value.toString();
  return `${value.min}-${value.max}`;
}

export function SessionEditForm({ session, onSave, onBack }: SessionEditFormProps) {
  const [editedSession, setEditedSession] = useState<JsonSession>({
    session: { ...session.session },
    blocks: session.blocks.map(b => ({
      ...b,
      launch_timer_sec: b.block_type === 'circuit' ? (b.launch_timer_sec ?? 15) : b.launch_timer_sec,
      exercises: b.exercises.map(e => ({ ...e }))
    }))
  });

  const handleSessionMetaChange = (field: keyof typeof editedSession.session, value: string | number) => {
    setEditedSession(prev => ({
      ...prev,
      session: { ...prev.session, [field]: value }
    }));
  };

  const handleBlockChange = (blockIndex: number, field: keyof Block, value: unknown) => {
    setEditedSession(prev => ({
      ...prev,
      blocks: prev.blocks.map((b, i) => 
        i === blockIndex ? { ...b, [field]: value } : b
      )
    }));
  };

  const handleExerciseChange = (blockIndex: number, exerciseIndex: number, field: keyof Exercise, value: unknown) => {
    setEditedSession(prev => ({
      ...prev,
      blocks: prev.blocks.map((b, bi) => 
        bi === blockIndex 
          ? {
              ...b,
              exercises: b.exercises.map((e, ei) =>
                ei === exerciseIndex ? { ...e, [field]: value } : e
              )
            }
          : b
      )
    }));
  };

  const handleSave = () => {
    onSave(editedSession);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Éditer la séance</h1>
          </div>
          <Button onClick={handleSave} size="sm">
            <Save className="w-4 h-4 mr-1" />
            Enregistrer
          </Button>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-6 pb-24">
          {/* Session Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session_name">Nom de la séance</Label>
                <Input
                  id="session_name"
                  value={editedSession.session.session_name}
                  onChange={(e) => handleSessionMetaChange('session_name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_type">Type</Label>
                  <Select
                    value={editedSession.session.session_type}
                    onValueChange={(v) => handleSessionMetaChange('session_type', v as SessionType)}
                  >
                    <SelectTrigger id="session_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SESSION_TYPE_FR).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dominant_focus">Focus</Label>
                  <Select
                    value={editedSession.session.dominant_focus}
                    onValueChange={(v) => handleSessionMetaChange('dominant_focus', v as DominantFocus)}
                  >
                    <SelectTrigger id="dominant_focus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOMINANT_FOCUS_FR).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durée estimée (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={editedSession.session.estimated_duration_min}
                  onChange={(e) => handleSessionMetaChange('estimated_duration_min', parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="global_notes">Notes globales</Label>
                <Textarea
                  id="global_notes"
                  value={editedSession.session.global_notes || ''}
                  onChange={(e) => handleSessionMetaChange('global_notes', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Blocks */}
          <Accordion type="multiple" className="space-y-3">
            {editedSession.blocks.map((block, blockIndex) => (
              <AccordionItem 
                key={block.block_id} 
                value={block.block_id}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <span className="font-medium">{block.block_name}</span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      {BLOCK_TYPE_FR[block.block_type]}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* Block settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Nom du bloc</Label>
                        <Input
                          value={block.block_name}
                          onChange={(e) => handleBlockChange(blockIndex, 'block_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={block.block_type}
                          onValueChange={(v) => handleBlockChange(blockIndex, 'block_type', v as BlockType)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(BLOCK_TYPE_FR).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {block.block_type === 'circuit' && (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Tours</Label>
                          <Input
                            value={rangeToString(block.rounds)}
                            onChange={(e) => handleBlockChange(blockIndex, 'rounds', parseRangeInput(e.target.value))}
                            placeholder="3"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Repos exos (s)</Label>
                          <Input
                            value={rangeToString(block.rest_between_exercises_sec)}
                            onChange={(e) => handleBlockChange(blockIndex, 'rest_between_exercises_sec', parseRangeInput(e.target.value))}
                            placeholder="15-20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Timer de lancement (s)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={block.launch_timer_sec ?? 15}
                            onChange={(e) => handleBlockChange(blockIndex, 'launch_timer_sec', parseInt(e.target.value, 10) || 0)}
                            placeholder="15"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Repos tours (s)</Label>
                          <Input
                            value={rangeToString(block.rest_between_rounds_sec)}
                            onChange={(e) => handleBlockChange(blockIndex, 'rest_between_rounds_sec', parseRangeInput(e.target.value))}
                            placeholder="45-60"
                          />
                        </div>
                      </div>
                    )}

                    {(block.block_type === 'activation' || block.block_type === 'cardio') && (
                      <div className="space-y-2">
                        <Label>Durée du bloc (s)</Label>
                        <Input
                          type="number"
                          value={typeof block.duration_sec === 'number' ? block.duration_sec : (block.duration_sec?.min || '')}
                          onChange={(e) => handleBlockChange(blockIndex, 'duration_sec', parseInt(e.target.value, 10) || null)}
                          placeholder="300"
                        />
                      </div>
                    )}

                    {/* Exercises */}
                    <div className="space-y-3 pt-2">
                      <Label className="text-muted-foreground">Exercices</Label>
                      {block.exercises.map((exercise, exIndex) => (
                        <Card key={exercise.exercise_id} className="bg-muted/30">
                          <CardContent className="p-3 space-y-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Nom de l'exercice</Label>
                              <Input
                                value={exercise.exercise_name}
                                onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'exercise_name', e.target.value)}
                                className="h-9"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {block.block_type === 'standard' && (
                                <div className="space-y-1">
                                  <Label className="text-xs">Séries</Label>
                                  <Input
                                    value={rangeToString(exercise.sets)}
                                    onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'sets', parseRangeInput(e.target.value))}
                                    className="h-9"
                                    placeholder="4"
                                  />
                                </div>
                              )}
                              <div className="space-y-1">
                                <Label className="text-xs">Reps</Label>
                                <Input
                                  value={rangeToString(exercise.reps)}
                                  onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'reps', parseRangeInput(e.target.value))}
                                  className="h-9"
                                  placeholder="8-12"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Reps/côté</Label>
                                <Input
                                  value={rangeToString(exercise.reps_per_side)}
                                  onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'reps_per_side', parseRangeInput(e.target.value))}
                                  className="h-9"
                                  placeholder="6"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Durée (s)</Label>
                                <Input
                                  value={rangeToString(exercise.duration_sec)}
                                  onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'duration_sec', parseRangeInput(e.target.value))}
                                  className="h-9"
                                  placeholder="30"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Iso hold (s)</Label>
                                <Input
                                  value={rangeToString(exercise.isometric_hold_sec)}
                                  onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'isometric_hold_sec', parseRangeInput(e.target.value))}
                                  className="h-9"
                                  placeholder="5"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Repos (s)</Label>
                                <Input
                                  value={rangeToString(exercise.rest_after_set_sec)}
                                  onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'rest_after_set_sec', parseRangeInput(e.target.value))}
                                  className="h-9"
                                  placeholder="60-90"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Tempo</Label>
                                <Input
                                  value={exercise.tempo || ''}
                                  onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'tempo', e.target.value || null)}
                                  className="h-9"
                                  placeholder="3-1-3"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">RIR</Label>
                                <Input
                                  value={rangeToString(exercise.rir)}
                                  onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'rir', parseRangeInput(e.target.value))}
                                  className="h-9"
                                  placeholder="2-3"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1">
                                  <Weight className="w-3 h-3" />
                                  Poids (kg)
                                </Label>
                                <Input
                                  type="number"
                                  value={exercise.target_weight ?? ''}
                                  onChange={(e) => handleExerciseChange(blockIndex, exIndex, 'target_weight', e.target.value ? parseFloat(e.target.value) : null)}
                                  className="h-9"
                                  placeholder="20"
                                  step={0.5}
                                  min={0}
                                />
                              </div>
                            </div>

                            {/* Bilateral checkbox - only show for timed exercises */}
                            {(getNumericValue(exercise.duration_sec) || getNumericValue(exercise.isometric_hold_sec)) && (
                              <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                  id={`bilateral-${blockIndex}-${exIndex}`}
                                  checked={exercise.bilateral || false}
                                  onCheckedChange={(checked) => 
                                    handleExerciseChange(blockIndex, exIndex, 'bilateral', checked === true)
                                  }
                                />
                                <Label 
                                  htmlFor={`bilateral-${blockIndex}-${exIndex}`}
                                  className="text-xs text-muted-foreground cursor-pointer"
                                >
                                  Bi-latéral (gauche puis droite)
                                </Label>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
