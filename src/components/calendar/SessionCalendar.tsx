import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScheduledSession } from '@/hooks/useScheduledSessions';
import type { SavedSession } from '@/hooks/useSavedSessions';

interface SessionCalendarProps {
  scheduledSessions: ScheduledSession[];
  savedSessions: SavedSession[];
  onSelectDate: (date: Date) => void;
  onScheduleSession: (date: Date) => void;
  selectedDate?: Date;
}

export function SessionCalendar({
  scheduledSessions,
  savedSessions,
  onSelectDate,
  onScheduleSession,
  selectedDate,
}: SessionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the first day of the week for the month
  const startDay = monthStart.getDay();
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  const getSessionsForDate = (date: Date): ScheduledSession[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduledSessions.filter(s => s.scheduled_date === dateStr);
  };

  const getSessionName = (session: ScheduledSession): string => {
    if (session.saved_session_id) {
      const saved = savedSessions.find(s => s.id === session.saved_session_id);
      return saved?.name || 'Séance';
    }
    return 'Séance';
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="bg-card rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={previousMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: adjustedStartDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {daysInMonth.map(day => {
          const sessions = getSessionsForDate(day);
          const hasSession = sessions.length > 0;
          const hasCompletedSession = sessions.some(s => s.completed);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-lg transition-colors relative',
                'hover:bg-secondary',
                isToday(day) && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                !isSameMonth(day, currentMonth) && 'text-muted-foreground opacity-50'
              )}
            >
              <span className={cn('text-sm', isSelected && 'font-bold')}>
                {format(day, 'd')}
              </span>
              {hasSession && (
                <div className="flex gap-0.5 mt-0.5">
                  {sessions.slice(0, 3).map((session, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        session.completed ? 'bg-timer-complete' : 'bg-primary',
                        isSelected && 'bg-primary-foreground'
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">
              {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
            </h4>
            <Button size="sm" variant="outline" onClick={() => onScheduleSession(selectedDate)}>
              <Plus className="w-4 h-4 mr-1" />
              Planifier
            </Button>
          </div>
          
          {getSessionsForDate(selectedDate).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune séance planifiée</p>
          ) : (
            <div className="space-y-2">
              {getSessionsForDate(selectedDate).map(session => (
                <div
                  key={session.id}
                  className={cn(
                    'p-3 rounded-lg bg-secondary',
                    session.completed && 'opacity-60'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        session.completed ? 'bg-timer-complete' : 'bg-primary'
                      )}
                    />
                    <span className="font-medium text-sm">{getSessionName(session)}</span>
                    {session.completed && (
                      <span className="text-xs text-muted-foreground">(Terminée)</span>
                    )}
                  </div>
                  {session.notes && (
                    <p className="text-xs text-muted-foreground mt-1 pl-4">{session.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
