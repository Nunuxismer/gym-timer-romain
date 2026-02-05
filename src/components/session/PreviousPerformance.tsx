import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp, Calendar, Weight, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useExerciseHistory, type LastExercisePerformance } from '@/hooks/useExerciseHistory';
import type { Exercise } from '@/types/jsonSession';

interface PreviousPerformanceProps {
  exercise: Exercise;
  compact?: boolean;
}

export function PreviousPerformance({ exercise, compact = false }: PreviousPerformanceProps) {
  const { getLastPerformance } = useExerciseHistory();
  const [performance, setPerformance] = useState<LastExercisePerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetch = async () => {
      setLoading(true);
      const result = await getLastPerformance(exercise.exercise_id);
      if (isMounted) {
        setPerformance(result);
        setLoading(false);
      }
    };
    
    fetch();
    return () => { isMounted = false; };
  }, [exercise.exercise_id, getLastPerformance]);

  if (loading) {
    return compact ? null : (
      <div className="animate-pulse h-12 bg-secondary/50 rounded-lg" />
    );
  }

  if (!performance) {
    return compact ? null : (
      <div className="text-xs text-muted-foreground text-center py-2">
        Première fois pour cet exercice
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'd MMM', { locale: fr });
    } catch {
      return '';
    }
  };

  const formatReps = (reps: number[] | null) => {
    if (!reps || reps.length === 0) return null;
    // If all reps are the same, just show one number
    if (reps.every(r => r === reps[0])) {
      return `${reps[0]} reps × ${reps.length}`;
    }
    return reps.join(' / ');
  };

  if (compact) {
    // Compact inline view for work phase
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg px-2 py-1">
        <TrendingUp className="w-3 h-3 text-primary" />
        <span>Dernière fois:</span>
        {performance.weight && (
          <Badge variant="outline" className="text-xs h-5 px-1.5 font-mono">
            {performance.weight}kg
          </Badge>
        )}
        {performance.reps && (
          <span className="font-medium">{formatReps(performance.reps)}</span>
        )}
        <span className="text-muted-foreground/60">({formatDate(performance.sessionDate)})</span>
      </div>
    );
  }

  // Full card view for intro screen
  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Dernière performance</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDate(performance.sessionDate)}
        </span>
      </div>
      
      <div className="flex gap-3">
        {performance.weight !== null && (
          <div className="flex items-center gap-1.5">
            <Weight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{performance.weight}</span>
            <span className="text-sm text-muted-foreground">kg</span>
          </div>
        )}
        
        {performance.reps && performance.reps.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{formatReps(performance.reps)}</span>
          </div>
        )}
      </div>
      
      {performance.notes && (
        <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">
          Note: {performance.notes}
        </p>
      )}
    </div>
  );
}
