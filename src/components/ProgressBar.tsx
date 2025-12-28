import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0 to 1
  phase: 'preparation' | 'activity' | 'rest' | 'complete';
  className?: string;
  showGlow?: boolean;
}

export function ProgressBar({ progress, phase, className, showGlow = false }: ProgressBarProps) {
  const phaseColors = {
    preparation: 'bg-timer-prep',
    activity: 'bg-timer-activity',
    rest: 'bg-timer-rest',
    complete: 'bg-timer-complete',
  };

  const glowColors = {
    preparation: 'shadow-timer-prep/50',
    activity: 'shadow-timer-activity/50',
    rest: 'shadow-timer-rest/50',
    complete: 'shadow-timer-complete/50',
  };

  return (
    <div className={cn('h-2 bg-secondary rounded-full overflow-hidden', className)}>
      <motion.div
        className={cn(
          'h-full rounded-full transition-colors duration-300',
          phaseColors[phase],
          showGlow && `shadow-lg ${glowColors[phase]}`
        )}
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
        transition={{ duration: 0.1, ease: 'linear' }}
      />
    </div>
  );
}

interface CycleProgressProps {
  currentCycle: number;
  totalCycles: number;
  className?: string;
}

export function CycleProgress({ currentCycle, totalCycles, className }: CycleProgressProps) {
  return (
    <div className={cn('flex gap-1.5', className)}>
      {Array.from({ length: totalCycles }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 h-1.5 rounded-full transition-all duration-300',
            i < currentCycle
              ? 'bg-timer-complete'
              : i === currentCycle - 1
              ? 'bg-timer-activity'
              : 'bg-secondary'
          )}
        />
      ))}
    </div>
  );
}
