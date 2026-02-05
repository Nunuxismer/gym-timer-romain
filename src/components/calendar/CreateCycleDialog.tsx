import { useState } from 'react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Plus, Trash2, Calendar, Repeat, Cloud, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { SavedSession } from '@/hooks/useSavedSessions';
import type { StoredSession } from '@/types/jsonSession';
import type { DayOfWeek, WeeklySlot, TrainingCycleConfig, TrainingCycleJson } from '@/types/trainingCycle';
import { DAY_NAMES_FR, DAY_NAMES_SHORT_FR } from '@/types/trainingCycle';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SchedulableSession {
  id: string;
  name: string;
  type: 'cloud' | 'local';
}

interface CreateCycleDialogProps {
  savedSessions: SavedSession[];
  localSessions?: StoredSession[];
  onCreateCycle: (config: TrainingCycleConfig) => Promise<void>;
  onClose: () => void;
}

export function CreateCycleDialog({
  savedSessions,
  localSessions = [],
  onCreateCycle,
  onClose,
}: CreateCycleDialogProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [cycleName, setCycleName] = useState('');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [numberOfWeeks, setNumberOfWeeks] = useState(4);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySlot[]>([]);
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Combine cloud and local sessions
  const allSessions: SchedulableSession[] = [
    ...savedSessions.map(s => ({ id: s.id, name: s.name, type: 'cloud' as const })),
    ...localSessions.map(s => ({ id: `local:${s.session.session_id}`, name: s.session.session_name, type: 'local' as const })),
  ];

  const addSlot = (dayOfWeek: DayOfWeek) => {
    if (allSessions.length === 0) {
      toast({
        title: 'Aucune séance',
        description: 'Importez d\'abord des séances avant de créer un cycle',
        variant: 'destructive',
      });
      return;
    }

    const firstSession = allSessions[0];
    setWeeklySchedule(prev => [
      ...prev,
      {
        dayOfWeek,
        sessionId: firstSession.id,
        sessionName: firstSession.name,
        isLocal: firstSession.type === 'local',
      },
    ]);
  };

  const updateSlot = (index: number, sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    setWeeklySchedule(prev => prev.map((slot, i) =>
      i === index
        ? { ...slot, sessionId, sessionName: session.name, isLocal: session.type === 'local' }
        : slot
    ));
  };

  const removeSlot = (index: number) => {
    setWeeklySchedule(prev => prev.filter((_, i) => i !== index));
  };

  const parseJsonCycle = (): TrainingCycleConfig | null => {
    try {
      const parsed: TrainingCycleJson = JSON.parse(jsonInput);
      
      if (!parsed.cycle_name || !parsed.start_date || !parsed.number_of_weeks || !parsed.weekly_schedule) {
        throw new Error('Format JSON invalide');
      }

      const schedule: WeeklySlot[] = parsed.weekly_schedule.map(slot => ({
        dayOfWeek: slot.day_of_week as DayOfWeek,
        sessionId: slot.session_id,
        sessionName: slot.session_name,
        isLocal: slot.session_id.startsWith('local:'),
      }));

      return {
        name: parsed.cycle_name,
        startDate: new Date(parsed.start_date),
        numberOfWeeks: parsed.number_of_weeks,
        weeklySchedule: schedule,
      };
    } catch (error) {
      toast({
        title: 'Erreur JSON',
        description: error instanceof Error ? error.message : 'Format JSON invalide',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let config: TrainingCycleConfig;

      if (activeTab === 'json') {
        const parsed = parseJsonCycle();
        if (!parsed) {
          setIsLoading(false);
          return;
        }
        config = parsed;
      } else {
        if (!cycleName.trim()) {
          toast({
            title: 'Nom requis',
            description: 'Donnez un nom à votre cycle',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        if (weeklySchedule.length === 0) {
          toast({
            title: 'Planning vide',
            description: 'Ajoutez au moins une séance au planning',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        config = {
          name: cycleName,
          startDate,
          numberOfWeeks,
          weeklySchedule,
        };
      }

      await onCreateCycle(config);
      onClose();
    } catch (error) {
      console.error('Error creating cycle:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le cycle',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate preview dates
  const previewDates = weeklySchedule.slice(0, 8).map(slot => {
    const date = addDays(startDate, slot.dayOfWeek);
    return {
      ...slot,
      date,
      formattedDate: format(date, 'd MMM', { locale: fr }),
    };
  });

  const endDate = addWeeks(startDate, numberOfWeeks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Créer un cycle d'entraînement
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'visual' | 'json')} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual">Interface visuelle</TabsTrigger>
              <TabsTrigger value="json">Import JSON</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="visual" className="mt-0 space-y-4">
              {/* Cycle name */}
              <div className="space-y-2">
                <Label>Nom du cycle</Label>
                <Input
                  placeholder="Ex: Cycle Force - Phase 1"
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                />
              </div>

              {/* Start date and duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(startDate, 'PPP', { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Nombre de semaines</Label>
                  <Select value={numberOfWeeks.toString()} onValueChange={(v) => setNumberOfWeeks(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} semaines</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Weekly schedule */}
              <div className="space-y-2">
                <Label>Planning hebdomadaire</Label>
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map(day => {
                    const daySlots = weeklySchedule.filter(s => s.dayOfWeek === day);
                    return (
                      <button
                        key={day}
                        onClick={() => addSlot(day)}
                        className={cn(
                          'aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-xs transition-colors',
                          daySlots.length > 0
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-secondary'
                        )}
                      >
                        <span className="font-medium">{DAY_NAMES_SHORT_FR[day]}</span>
                        {daySlots.length > 0 && (
                          <span className="text-primary font-bold">{daySlots.length}</span>
                        )}
                        {daySlots.length === 0 && (
                          <Plus className="w-3 h-3 text-muted-foreground mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Slot list */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {weeklySchedule.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                      <Badge variant="outline" className="shrink-0">
                        {DAY_NAMES_SHORT_FR[slot.dayOfWeek]}
                      </Badge>
                      <Select value={slot.sessionId} onValueChange={(v) => updateSlot(index, v)}>
                        <SelectTrigger className="flex-1 h-8">
                          <SelectValue />
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeSlot(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                {weeklySchedule.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Cliquez sur un jour pour ajouter une séance
                  </p>
                )}
              </div>

              {/* Preview */}
              {weeklySchedule.length > 0 && (
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">
                    Aperçu: {numberOfWeeks} semaines • {weeklySchedule.length * numberOfWeeks} séances au total
                  </p>
                  <p className="text-sm">
                    Du {format(startDate, 'd MMM yyyy', { locale: fr })} au {format(endDate, 'd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="json" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>JSON du cycle</Label>
                <Textarea
                  placeholder={`{
  "cycle_name": "Cycle Force - Phase 1",
  "start_date": "${format(new Date(), 'yyyy-MM-dd')}",
  "number_of_weeks": 4,
  "weekly_schedule": [
    { "day_of_week": 0, "session_id": "session-id-1", "session_name": "Push" },
    { "day_of_week": 2, "session_id": "session-id-2", "session_name": "Pull" },
    { "day_of_week": 4, "session_id": "session-id-1", "session_name": "Push" }
  ]
}`}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={12}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  day_of_week: 0 = Lundi, 6 = Dimanche
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Création...' : 'Créer le cycle'}
          </Button>
        </div>
      </div>
    </div>
  );
}
