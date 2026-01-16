import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, X, Cloud, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { SavedSession } from '@/hooks/useSavedSessions';
import type { StoredSession } from '@/types/jsonSession';
import { cn } from '@/lib/utils';

export interface SchedulableSession {
  id: string;
  name: string;
  type: 'cloud' | 'local';
}

interface ScheduleSessionDialogProps {
  date: Date;
  savedSessions: SavedSession[];
  localSessions?: StoredSession[];
  onSchedule: (sessionId: string, date: Date, notes?: string, isLocal?: boolean) => Promise<void>;
  onClose: () => void;
}

export function ScheduleSessionDialog({
  date: initialDate,
  savedSessions,
  localSessions = [],
  onSchedule,
  onClose,
}: ScheduleSessionDialogProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Combine cloud and local sessions into a unified list
  const allSessions: SchedulableSession[] = [
    ...savedSessions.map(s => ({ id: s.id, name: s.name, type: 'cloud' as const })),
    ...localSessions.map(s => ({ id: `local:${s.session.session_id}`, name: s.session.session_name, type: 'local' as const })),
  ];

  const handleSubmit = async () => {
    if (!selectedSessionId) return;
    
    setIsLoading(true);
    try {
      const isLocal = selectedSessionId.startsWith('local:');
      const actualId = isLocal ? selectedSessionId.replace('local:', '') : selectedSessionId;
      await onSchedule(actualId, selectedDate, notes || undefined, isLocal);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Planifier une séance</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Session selector */}
          <div className="space-y-2">
            <Label>Séance</Label>
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une séance" />
              </SelectTrigger>
              <SelectContent>
                {allSessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center gap-2">
                      {session.type === 'cloud' ? (
                        <Cloud className="w-3 h-3 text-primary" />
                      ) : (
                        <HardDrive className="w-3 h-3 text-muted-foreground" />
                      )}
                      {session.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allSessions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucune séance disponible. Importez d'abord une séance.
              </p>
            )}
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP', { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Ajouter des notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSessionId || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Planification...' : 'Planifier'}
          </Button>
        </div>
      </div>
    </div>
  );
}
