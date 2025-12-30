import { useState } from 'react';
import { RestTimerPreset, DEFAULT_REST_PRESET } from '@/types/restTimer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Save, Play, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface RestTimerFormProps {
  preset?: RestTimerPreset;
  onSave: (data: Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onStart: (data: Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBack: () => void;
}

export function RestTimerForm({ preset, onSave, onStart, onBack }: RestTimerFormProps) {
  const [name, setName] = useState(preset?.name || '');
  const [totalSets, setTotalSets] = useState(preset?.totalSets ?? DEFAULT_REST_PRESET.totalSets);
  const [restSeconds, setRestSeconds] = useState(preset?.restSeconds ?? DEFAULT_REST_PRESET.restSeconds);

  const getFormData = (): Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'> => ({
    name: name || 'Timer sans nom',
    totalSets,
    restSeconds,
  });

  const handleSave = () => onSave(getFormData());
  const handleStart = () => onStart(getFormData());

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold flex-1">
            {preset ? 'Modifier le timer' : 'Nouveau timer repos'}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom du timer</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Squat 5x5, Développé couché..."
            className="h-12 text-base"
          />
        </div>

        {/* Sets */}
        <div className="space-y-2">
          <Label>🔁 Nombre de séries</Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTotalSets(Math.max(1, totalSets - 1))}
            >
              -
            </Button>
            <div className="flex-1 text-center font-display text-5xl text-foreground">
              {totalSets}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTotalSets(Math.min(20, totalSets + 1))}
            >
              +
            </Button>
          </div>
        </div>

        {/* Rest time */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">💤 Temps de repos</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRestSeconds(Math.max(10, restSeconds - 5))}
              className="shrink-0"
            >
              -5
            </Button>
            <div className="flex-1 text-center font-display text-4xl phase-rest">
              {formatTime(restSeconds)}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRestSeconds(Math.min(600, restSeconds + 5))}
              className="shrink-0"
            >
              +5
            </Button>
          </div>
          <Slider
            value={[restSeconds]}
            onValueChange={([v]) => setRestSeconds(v)}
            min={10}
            max={300}
            step={5}
            className="mt-2"
          />
        </div>
      </div>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSave}
            className="flex-1"
          >
            <Save className="w-5 h-5" />
            Enregistrer
          </Button>
          <Button
            variant="timerStart"
            size="lg"
            onClick={handleStart}
            className="flex-1"
          >
            <Play className="w-5 h-5" />
            Démarrer
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
