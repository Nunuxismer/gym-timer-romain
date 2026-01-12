import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Clock, Calendar, Star, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SessionHistoryEntry, ExerciseLog } from '@/hooks/useSessionHistory';

interface SessionHistoryDetailProps {
  entry: SessionHistoryEntry;
  exerciseLogs: ExerciseLog[];
  onBack: () => void;
}

export function SessionHistoryDetail({ entry, exerciseLogs, onBack }: SessionHistoryDetailProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}min`;
    }
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  const formatWeight = (weights: number[] | null): string => {
    if (!weights || weights.length === 0) return '-';
    const unique = [...new Set(weights)];
    if (unique.length === 1) return `${unique[0]}kg`;
    return weights.map(w => `${w}kg`).join(', ');
  };

  const formatReps = (reps: number[] | null): string => {
    if (!reps || reps.length === 0) return '-';
    const unique = [...new Set(reps)];
    if (unique.length === 1) return `${unique[0]} reps`;
    return reps.join(', ');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground truncate">{entry.session_name}</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Summary */}
        <div className="bg-card rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-foreground">Résumé</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{format(new Date(entry.completed_at), 'PPP', { locale: fr })}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Durée</p>
                <p className="text-sm font-medium">{formatDuration(entry.duration_seconds)}</p>
              </div>
            </div>
          </div>

          {entry.rating && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span className="font-medium">{entry.rating}/5</span>
            </div>
          )}

          {entry.notes && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">{entry.notes}</p>
            </div>
          )}
        </div>

        {/* Exercise logs */}
        {exerciseLogs.length > 0 && (
          <div className="bg-card rounded-xl p-4 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              Exercices ({exerciseLogs.length})
            </h2>
            
            <div className="space-y-3">
              {exerciseLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-secondary"
                >
                  <h4 className="font-medium text-foreground">{log.exercise_name}</h4>
                  
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    {log.sets_completed && (
                      <div>
                        <span className="text-muted-foreground">Séries: </span>
                        <span className="font-medium">{log.sets_completed}</span>
                      </div>
                    )}
                    {log.reps_completed && (
                      <div>
                        <span className="text-muted-foreground">Reps: </span>
                        <span className="font-medium">{formatReps(log.reps_completed)}</span>
                      </div>
                    )}
                    {log.weight_used && (
                      <div>
                        <span className="text-muted-foreground">Charge: </span>
                        <span className="font-medium">{formatWeight(log.weight_used)}</span>
                      </div>
                    )}
                  </div>
                  
                  {log.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
