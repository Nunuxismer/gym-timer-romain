import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Weight, ChevronUp, ChevronDown } from 'lucide-react';
import type { Exercise } from '@/types/jsonSession';
import { getNumericValue } from '@/types/jsonSession';

interface TargetWeightEditorProps {
  exercise: Exercise;
  totalSets: number;
  currentTargetWeight?: number;
  onSetTargetWeight: (weight: number) => void;
}

export function TargetWeightEditor({
  exercise,
  totalSets,
  currentTargetWeight,
  onSetTargetWeight,
}: TargetWeightEditorProps) {
  const [weight, setWeight] = useState<number>(currentTargetWeight ?? 0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentTargetWeight !== undefined) {
      setWeight(currentTargetWeight);
    }
  }, [currentTargetWeight]);

  const handleWeightChange = (newWeight: number) => {
    const validWeight = Math.max(0, newWeight);
    setWeight(validWeight);
  };

  const handleSave = () => {
    onSetTargetWeight(weight);
    setIsOpen(false);
  };

  const incrementWeight = () => handleWeightChange(weight + 2.5);
  const decrementWeight = () => handleWeightChange(weight - 2.5);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
        >
          <Weight className="w-3.5 h-3.5" />
          {currentTargetWeight ? `${currentTargetWeight}kg` : 'Poids cible'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              Poids cible pour {exercise.exercise_name}
            </Label>
            <p className="text-xs text-muted-foreground">
              ({getNumericValue(exercise.sets) ?? totalSets} séries)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={decrementWeight}
              disabled={weight <= 0}
              className="h-9 w-9"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              value={weight}
              onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
              className="text-center font-bold h-9"
              min={0}
              step={0.5}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={incrementWeight}
              className="h-9 w-9"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">kg</span>
          </div>

          {/* Quick weight buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[5, 10, 15, 20, 25, 30, 35, 40].map((w) => (
              <Button
                key={w}
                variant={weight === w ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleWeightChange(w)}
                className="h-7 px-2 text-xs"
              >
                {w}
              </Button>
            ))}
          </div>

          <Button onClick={handleSave} className="w-full" size="sm">
            Valider
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
