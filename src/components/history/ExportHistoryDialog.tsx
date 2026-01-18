import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { SessionHistoryEntry, ExerciseLog } from '@/hooks/useSessionHistory';
import { toast } from '@/hooks/use-toast';

interface ExportHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: SessionHistoryEntry[];
  getExerciseLogs: (sessionHistoryId: string) => Promise<ExerciseLog[]>;
}

export function ExportHistoryDialog({
  open,
  onOpenChange,
  history,
  getExerciseLogs,
}: ExportHistoryDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une plage de dates',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      // Filter sessions by date range
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      const filteredSessions = history.filter(session => {
        const sessionDate = new Date(session.completed_at);
        return sessionDate >= startOfDay && sessionDate <= endOfDay;
      });

      if (filteredSessions.length === 0) {
        toast({
          title: 'Aucune séance',
          description: 'Aucune séance trouvée dans cette plage de dates',
          variant: 'destructive',
        });
        setIsExporting(false);
        return;
      }

      // Fetch exercise logs for each session
      const sessionsWithLogs = await Promise.all(
        filteredSessions.map(async (session) => {
          const logs = await getExerciseLogs(session.id);
          return {
            ...session,
            exercise_logs: logs,
          };
        })
      );

      // Build export data
      const exportData = {
        export_date: new Date().toISOString(),
        date_range: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        },
        sessions: sessionsWithLogs.map(session => ({
          id: session.id,
          session_name: session.session_name,
          started_at: session.started_at,
          completed_at: session.completed_at,
          duration_seconds: session.duration_seconds,
          rating: session.rating,
          notes: session.notes,
          exercises: session.exercise_logs?.map(log => ({
            exercise_id: log.exercise_id,
            exercise_name: log.exercise_name,
            sets_completed: log.sets_completed,
            reps_completed: log.reps_completed,
            weight_used: log.weight_used,
            notes: log.notes,
          })) || [],
        })),
      };

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxLineWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Rapport de Séances', margin, yPos);
      yPos += 10;

      // Date range
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Période: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
        margin,
        yPos
      );
      yPos += 8;
      doc.text(`Exporté le: ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, margin, yPos);
      yPos += 15;

      // Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Résumé', margin, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre de séances: ${sessionsWithLogs.length}`, margin, yPos);
      yPos += 6;
      const totalDuration = sessionsWithLogs.reduce((acc, s) => acc + s.duration_seconds, 0);
      const hours = Math.floor(totalDuration / 3600);
      const minutes = Math.floor((totalDuration % 3600) / 60);
      doc.text(`Durée totale: ${hours}h ${minutes}min`, margin, yPos);
      yPos += 15;

      // Sessions details
      sessionsWithLogs.forEach((session, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${session.session_name}`, margin, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Date: ${format(new Date(session.completed_at), 'dd/MM/yyyy à HH:mm')}`,
          margin + 5,
          yPos
        );
        yPos += 5;

        const durationMins = Math.floor(session.duration_seconds / 60);
        doc.text(`Durée: ${durationMins} min`, margin + 5, yPos);
        yPos += 5;

        if (session.rating) {
          doc.text(`Note: ${session.rating}/5`, margin + 5, yPos);
          yPos += 5;
        }

        if (session.notes) {
          const noteLines = doc.splitTextToSize(`Commentaire: ${session.notes}`, maxLineWidth - 10);
          noteLines.forEach((line: string) => {
            if (yPos > 280) {
              doc.addPage();
              yPos = margin;
            }
            doc.text(line, margin + 5, yPos);
            yPos += 5;
          });
        }

        // Exercise logs
        if (session.exercise_logs && session.exercise_logs.length > 0) {
          yPos += 3;
          doc.setFont('helvetica', 'bold');
          doc.text('Exercices:', margin + 5, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');

          session.exercise_logs.forEach(log => {
            if (yPos > 280) {
              doc.addPage();
              yPos = margin;
            }

            doc.text(`• ${log.exercise_name}`, margin + 10, yPos);
            yPos += 5;

            if (log.sets_completed) {
              doc.text(`  Séries: ${log.sets_completed}`, margin + 15, yPos);
              yPos += 4;
            }

            if (log.reps_completed && log.reps_completed.length > 0) {
              doc.text(`  Reps: ${log.reps_completed.join(', ')}`, margin + 15, yPos);
              yPos += 4;
            }

            if (log.weight_used && log.weight_used.length > 0) {
              doc.text(`  Poids: ${log.weight_used.map(w => `${w}kg`).join(', ')}`, margin + 15, yPos);
              yPos += 4;
            }

            if (log.notes) {
              const logNoteLines = doc.splitTextToSize(`  Note: ${log.notes}`, maxLineWidth - 20);
              logNoteLines.forEach((line: string) => {
                if (yPos > 280) {
                  doc.addPage();
                  yPos = margin;
                }
                doc.text(line, margin + 15, yPos);
                yPos += 4;
              });
            }
          });
        }

        yPos += 10;
      });

      // Add JSON data at the end
      doc.addPage();
      yPos = margin;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Données JSON (pour import)', margin, yPos);
      yPos += 10;

      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      const jsonString = JSON.stringify(exportData, null, 2);
      const jsonLines = doc.splitTextToSize(jsonString, maxLineWidth);
      
      jsonLines.forEach((line: string) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += 4;
      });

      // Save PDF
      const fileName = `seances_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      toast({
        title: 'Export réussi',
        description: `${sessionsWithLogs.length} séance(s) exportée(s)`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter les données",
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Exporter l'historique
          </DialogTitle>
          <DialogDescription>
            Sélectionnez une plage de dates pour exporter vos séances en PDF avec les données JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date de début</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP', { locale: fr }) : 'Sélectionner...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date de fin</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP', { locale: fr }) : 'Sélectionner...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => startDate ? date < startDate : false}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={!startDate || !endDate || isExporting}
          >
            {isExporting ? (
              'Export en cours...'
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
