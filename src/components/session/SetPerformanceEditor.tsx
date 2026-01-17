import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronUp, ChevronDown, Weight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SetPerformance } from '@/hooks/usePerformanceTracking';
import type { Exercise } from '@/types/jsonSession';
import { getNumericValue } from '@/types/jsonSession';

interface SetPerformanceEditorProps {
  exercise: Exercise;
  setIndex: number; // 0-indexed
  performance: SetPerformance | undefined;
  onUpdateReps: (reps: number) => void;
  onUpdateWeight: (weight: number) => void;
}

export function SetPerformanceEditor({
  exercise,
  setIndex,
  performance,
  onUpdateReps,
  onUpdateWeight,
}: SetPerformanceEditorProps) {
  // Get target values from exercise definition or previous actual values
  const defaultReps = performance?.actualReps ?? performance?.targetReps ?? getNumericValue(exercise.reps) ?? getNumericValue(exercise.reps_per_side) ?? 0;
  const defaultWeight = performance?.actualWeight ?? performance?.targetWeight ?? 0;
  
  const [reps, setReps] = useState<number>(defaultReps);
  const [weight, setWeight] = useState<number>(defaultWeight);
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync with external state when it changes
  useEffect(() => {
    if (performance?.actualReps !== undefined) {
      setReps(performance.actualReps);
    }
    if (performance?.actualWeight !== undefined) {
      setWeight(performance.actualWeight);
    }
  }, [performance?.actualReps, performance?.actualWeight]);

  const handleRepsChange = (newReps: number) => {
    const validReps = Math.max(0, newReps);
    setReps(validReps);
    onUpdateReps(validReps);
  };

  const handleWeightChange = (newWeight: number) => {
    const validWeight = Math.max(0, newWeight);
    setWeight(validWeight);
    onUpdateWeight(validWeight);
  };

  const incrementReps = () => handleRepsChange(reps + 1);
  const decrementReps = () => handleRepsChange(reps - 1);
  const incrementWeight = () => handleWeightChange(weight + 2.5);
  const decrementWeight = () => handleWeightChange(weight - 2.5);

  const resetToDefault = () => {
    const defReps = getNumericValue(exercise.reps) ?? getNumericValue(exercise.reps_per_side) ?? 0;
    handleRepsChange(defReps);
    handleWeightChange(performance?.targetWeight ?? 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-secondary/80 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Weight className="w-4 h-4 text-primary" />
              Série {setIndex + 1} — Ajuster
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4"
            >
              {/* Reps control */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Répétitions réelles</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementReps}
                    disabled={reps <= 0}
                    className="h-10 w-10"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={reps}
                    onChange={(e) => handleRepsChange(parseInt(e.target.value) || 0)}
                    className="text-center text-lg font-bold h-10 w-20"
                    min={0}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementReps}
                    className="h-10 w-10"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2">reps</span>
                </div>
              </div>

              {/* Weight control */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Poids utilisé</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementWeight}
                    disabled={weight <= 0}
                    className="h-10 w-10"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                    className="text-center text-lg font-bold h-10 w-20"
                    min={0}
                    step={0.5}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementWeight}
                    className="h-10 w-10"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2">kg</span>
                </div>
              </div>

              {/* Quick weight buttons */}
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 20, 25, 30].map((w) => (
                  <Button
                    key={w}
                    variant={weight === w ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleWeightChange(w)}
                    className="flex-1 min-w-[3rem]"
                  >
                    {w}kg
                  </Button>
                ))}
              </div>

              {/* Reset button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefault}
                className="w-full text-muted-foreground"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                Réinitialiser
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
