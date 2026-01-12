import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Calendar, Star, ChevronRight, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SessionHistoryEntry } from '@/hooks/useSessionHistory';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface SessionHistoryListProps {
  history: SessionHistoryEntry[];
  onViewDetails: (entry: SessionHistoryEntry) => void;
  onDelete: (id: string) => Promise<boolean>;
}

export function SessionHistoryList({ history, onViewDetails, onDelete }: SessionHistoryListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Aucun historique</h3>
        <p className="text-muted-foreground text-sm">
          Vos séances terminées apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {history.map(entry => (
          <div
            key={entry.id}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{entry.session_name}</h4>
                
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(entry.completed_at), 'PPP', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(entry.duration_seconds)}</span>
                  </div>
                  {entry.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span>{entry.rating}/5</span>
                    </div>
                  )}
                </div>

                {entry.notes && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {entry.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(entry.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(entry)}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer l'entrée"
        description="Cette action est irréversible. Voulez-vous vraiment supprimer cette entrée de l'historique ?"
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
