import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Play, Eye, MoreVertical, Trash2, Clock, Target, Activity, Pencil, Cloud, CalendarDays } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { StoredSession } from '@/types/jsonSession';
import { SESSION_TYPE_FR, DOMINANT_FOCUS_FR } from '@/types/jsonSession';

interface ScheduledDateInfo {
  id: string;
  date: string; // yyyy-MM-dd
  completed: boolean;
}

interface SessionCardProps {
  session: StoredSession;
  onStart: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSaveToCloud?: () => void;
  isLoggedIn?: boolean;
  scheduledDates?: ScheduledDateInfo[];
}

export function SessionCard({ session, onStart, onView, onEdit, onDelete, onSaveToCloud, isLoggedIn, scheduledDates }: SessionCardProps) {
  const { session: meta, blocks } = session;
  const totalExercises = blocks.reduce((sum, b) => sum + b.exercises.length, 0);

  // Sort scheduled dates: upcoming first, then past
  const sortedDates = scheduledDates
    ? [...scheduledDates].sort((a, b) => a.date.localeCompare(b.date))
    : [];
  const upcomingDates = sortedDates.filter(d => !d.completed && (isToday(parseISO(d.date)) || !isPast(parseISO(d.date))));
  const pastDates = sortedDates.filter(d => d.completed || isPast(parseISO(d.date)) && !isToday(parseISO(d.date)));
  const displayDates = [...upcomingDates, ...pastDates].slice(0, 3);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {meta.session_name}
            </h3>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                <Activity className="w-3 h-3" />
                {SESSION_TYPE_FR[meta.session_type]}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                <Target className="w-3 h-3" />
                {DOMINANT_FOCUS_FR[meta.dominant_focus]}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {meta.estimated_duration_min} min
              </span>
              <span>
                {blocks.length} bloc{blocks.length > 1 ? 's' : ''} • {totalExercises} exercice{totalExercises > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="w-4 h-4 mr-2" />
                Voir la séance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Éditer
              </DropdownMenuItem>
              {isLoggedIn && onSaveToCloud && (
                <DropdownMenuItem onClick={onSaveToCloud}>
                  <Cloud className="w-4 h-4 mr-2" />
                  Sauvegarder dans le cloud
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Scheduled dates */}
        {scheduledDates !== undefined && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Planifiée le</span>
            </div>
            {displayDates.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Non planifiée</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {displayDates.map(d => {
                  const date = parseISO(d.date);
                  const upcoming = !d.completed && (isToday(date) || !isPast(date));
                  return (
                    <span
                      key={d.id}
                      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.completed
                          ? 'bg-secondary text-muted-foreground line-through'
                          : upcoming
                          ? 'bg-primary/15 text-primary'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {format(date, 'd MMM', { locale: fr })}
                    </span>
                  );
                })}
                {sortedDates.length > 3 && (
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    +{sortedDates.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1">
            <Eye className="w-4 h-4 mr-1" />
            Fiche
          </Button>
          <Button variant="default" size="sm" onClick={onStart} className="flex-1">
            <Play className="w-4 h-4 mr-1" />
            Lancer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
