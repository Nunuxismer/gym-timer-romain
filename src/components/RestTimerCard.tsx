import { RestTimerPreset } from '@/types/restTimer';
import { Button } from '@/components/ui/button';
import { Play, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface RestTimerCardProps {
  preset: RestTimerPreset;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RestTimerCard({ preset, onStart, onEdit, onDelete }: RestTimerCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card rounded-xl p-4 border border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg text-foreground truncate flex-1">
          {preset.name || 'Timer sans nom'}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <span className="text-primary font-medium">{preset.totalSets}</span> séries
        </span>
        <span className="flex items-center gap-1">
          <span className="phase-rest font-medium">{formatTime(preset.restSeconds)}</span> repos
        </span>
      </div>

      <Button
        variant="timerStart"
        size="lg"
        onClick={onStart}
        className="w-full"
      >
        <Play className="w-5 h-5" />
        Démarrer
      </Button>
    </motion.div>
  );
}
