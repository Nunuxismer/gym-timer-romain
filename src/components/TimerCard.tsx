import { TimerPreset } from '@/types/timer';
import { Button } from '@/components/ui/button';
import { Play, Edit2, Copy, Trash2, Clock, Repeat, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerCardProps {
  preset: TimerPreset;
  onStart: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TimerCard({ preset, onStart, onEdit, onDuplicate, onDelete }: TimerCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const totalTime = preset.preparationSeconds + 
    (preset.activitySeconds + preset.restSeconds) * preset.cycles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-xl border border-border p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground truncate">
            {preset.name || 'Timer sans nom'}
          </h3>
          <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
            <Clock className="w-4 h-4" />
            {formatTime(totalTime)} au total
          </p>
        </div>
        <Button
          variant="timerStart"
          size="iconLg"
          onClick={() => onStart(preset.id)}
          className="shrink-0"
        >
          <Play className="w-6 h-6" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="text-timer-activity font-display text-2xl">
            {formatTime(preset.activitySeconds)}
          </div>
          <div className="text-muted-foreground text-xs flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" />
            Activité
          </div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="text-timer-rest font-display text-2xl">
            {formatTime(preset.restSeconds)}
          </div>
          <div className="text-muted-foreground text-xs">Repos</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="text-foreground font-display text-2xl">
            {preset.cycles}
          </div>
          <div className="text-muted-foreground text-xs flex items-center justify-center gap-1">
            <Repeat className="w-3 h-3" />
            Cycles
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(preset.id)}
          className="flex-1"
        >
          <Edit2 className="w-4 h-4" />
          Modifier
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDuplicate(preset.id)}
          className="flex-1"
        >
          <Copy className="w-4 h-4" />
          Dupliquer
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(preset.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
