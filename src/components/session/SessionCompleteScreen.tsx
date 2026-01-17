import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, RotateCcw, Home, Send, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import type { StoredSession } from '@/types/jsonSession';
import type { SessionPerformanceData } from '@/hooks/usePerformanceTracking';

interface SessionCompleteScreenProps {
  session: StoredSession;
  performanceData: SessionPerformanceData;
  onSetNotes: (notes: string) => void;
  onSetRating: (rating: number) => void;
  onSave: () => Promise<void>;
  onRestart: () => void;
  onExit: () => void;
  isSaving: boolean;
}

export function SessionCompleteScreen({
  session,
  performanceData,
  onSetNotes,
  onSetRating,
  onSave,
  onRestart,
  onExit,
  isSaving,
}: SessionCompleteScreenProps) {
  const [notes, setNotes] = useState(performanceData.sessionNotes);
  const [rating, setRating] = useState(performanceData.rating ?? 0);
  const [hasSaved, setHasSaved] = useState(false);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onSetNotes(value);
  };

  const handleRatingChange = (value: number) => {
    setRating(value);
    onSetRating(value);
  };

  const handleSave = async () => {
    await onSave();
    setHasSaved(true);
  };

  // Calculate session stats
  const completedExercises = Array.from(performanceData.exercises.values()).filter(
    ex => ex.sets.some(s => s.completed)
  ).length;
  const totalSets = Array.from(performanceData.exercises.values()).reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-background flex flex-col p-6"
    >
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-timer-complete/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-timer-complete" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Séance terminée !
        </h1>
        <p className="text-muted-foreground">
          {session.session.session_name}
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-secondary/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{completedExercises}</p>
            <p className="text-xs text-muted-foreground">exercices</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalSets}</p>
            <p className="text-xs text-muted-foreground">séries complétées</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Comment s'est passée la séance ?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant={rating >= value ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleRatingChange(value)}
                className={`w-10 h-10 ${rating >= value ? 'bg-primary' : ''}`}
              >
                <Star className={`w-5 h-5 ${rating >= value ? 'fill-current' : ''}`} />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes for coach */}
      <Card className="mb-6 flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Notes pour le coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="sr-only">Notes de séance</Label>
          <Textarea
            placeholder="Commentaires sur la séance, sensations, difficultés rencontrées, ajustements suggérés..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Ces notes seront sauvegardées avec votre historique de séance.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3 safe-bottom">
        {!hasSaved ? (
          <Button
            variant="default"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              'Sauvegarde...'
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Sauvegarder la séance
              </>
            )}
          </Button>
        ) : (
          <div className="text-center p-3 bg-timer-complete/10 rounded-lg border border-timer-complete/20">
            <Check className="w-5 h-5 text-timer-complete inline mr-2" />
            <span className="text-timer-complete font-medium">Séance sauvegardée !</span>
          </div>
        )}
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onRestart}
            className="flex-1"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Recommencer
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onExit}
            className="flex-1"
          >
            <Home className="w-5 h-5 mr-2" />
            Accueil
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
