import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Upload, ArrowLeft, Layers, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isCombinedFormat, validateCombinedJson, validateSessionJson } from '@/lib/sessionValidator';
import type { JsonSession, StoredSession } from '@/types/jsonSession';
import type { CycleValidationResult } from '@/lib/sessionValidator';

interface SessionJsonInputProps {
  onImport: (jsonString: string) => { success: boolean; errors: string[]; session?: StoredSession };
  onSuccess: (session: StoredSession) => void;
  onBack: () => void;
  onImportCombined?: (sessions: JsonSession[], cycle: CycleValidationResult['cycle']) => void;
}

export function SessionJsonInput({ onImport, onSuccess, onBack, onImportCombined }: SessionJsonInputProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [combinedSummary, setCombinedSummary] = useState<{ sessionCount: number; cycleName: string | null } | null>(null);

  const handleValidate = () => {
    const trimmed = jsonInput.trim();
    if (!trimmed) return;

    // Detect combined format
    if (isCombinedFormat(trimmed)) {
      const result = validateCombinedJson(trimmed);
      if (result.valid && result.sessions.length > 0) {
        setIsValid(true);
        setErrors([]);
        setCombinedSummary({
          sessionCount: result.sessions.length,
          cycleName: result.cycle?.cycle_name || null,
        });
        onImportCombined?.(result.sessions, result.cycle);
      } else {
        setIsValid(false);
        setErrors(result.errors.map(e => e.path ? `${e.path}: ${e.message}` : e.message));
        setCombinedSummary(null);
      }
      return;
    }

    // Single session format
    setCombinedSummary(null);
    const result = onImport(trimmed);
    if (result.success && result.session) {
      setIsValid(true);
      setErrors([]);
      onSuccess(result.session);
    } else {
      setIsValid(false);
      setErrors(result.errors);
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.md,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          const text = re.target?.result as string;
          setJsonInput(text);
          setErrors([]);
          setIsValid(null);
          setCombinedSummary(null);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    setJsonInput('');
    setErrors([]);
    setIsValid(null);
    setCombinedSummary(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background p-4"
    >
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Importer une séance</h1>
          <p className="text-sm text-muted-foreground">Séance unique ou cycle complet (séances + planning)</p>
        </div>
      </header>

      {/* JSON Input */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">JSON de la séance</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleFileUpload}>
                <Upload className="w-4 h-4 mr-1" />
                Fichier
              </Button>
              {jsonInput && (
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Effacer
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setErrors([]);
              setIsValid(null);
              setCombinedSummary(null);
            }}
            placeholder='{"session": {...}, "blocks": [...]}  ou  {"sessions": [...], "cycle": {...}}'
            className="min-h-[300px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Validation Result */}
      <AnimatePresence>
        {isValid === true && combinedSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Card className="border-timer-complete bg-timer-complete/10">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-timer-complete flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">Import combiné réussi !</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-8">
                  <Layers className="w-4 h-4" />
                  <span>{combinedSummary.sessionCount} séance(s) importée(s)</span>
                </div>
                {combinedSummary.cycleName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-8">
                    <FileJson className="w-4 h-4" />
                    <span>Cycle « {combinedSummary.cycleName} » créé</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isValid === true && !combinedSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Card className="border-timer-complete bg-timer-complete/10">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="w-5 h-5 text-timer-complete flex-shrink-0" />
                <span className="text-sm text-foreground">JSON valide ! La séance a été importée.</span>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Card className="border-destructive bg-destructive/10">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <CardTitle className="text-base text-destructive">
                    Erreurs de validation ({errors.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-foreground">
                      {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="default"
          size="lg"
          onClick={handleValidate}
          disabled={!jsonInput.trim()}
          className="flex-1"
        >
          Valider le JSON
        </Button>
      </div>
    </motion.div>
  );
}
