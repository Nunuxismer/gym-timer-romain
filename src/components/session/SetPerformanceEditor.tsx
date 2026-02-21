import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronUp, ChevronDown, Weight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SetPerformance } from '@/hooks/usePerformanceTracking';
import type { Exercise } from '@/types/jsonSession';
import { getNumericValue } from '@/types/jsonSession';
import { ScrollPicker } from './ScrollPicker';

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
  const defaultReps = performance?.actualReps ?? performance?.targetReps ?? getNumericValue(exercise.reps) ?? getNumericValue(exercise.reps_per_side) ?? 0;
  const defaultWeight = performance?.actualWeight ?? performance?.targetWeight ?? 0;
  
  const [reps, setReps] = useState<number>(defaultReps);
  const [weight, setWeight] = useState<number>(defaultWeight);
  const [isExpanded, setIsExpanded] = useState(true);

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
              className="space-y-3"
            >
              {/* Horizontal scroll pickers for reps and weight */}
              <div className="flex items-start justify-center gap-8">
                <ScrollPicker
                  value={reps}
                  onChange={handleRepsChange}
                  min={0}
                  max={50}
                  step={1}
                  label="Reps"
                  suffix="reps"
                  className="flex-1"
                />
                <ScrollPicker
                  value={weight}
                  onChange={handleWeightChange}
                  min={0}
                  max={200}
                  step={2.5}
                  label="Poids"
                  suffix="kg"
                  className="flex-1"
                />
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
