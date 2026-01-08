import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateSessionJson, ValidationError } from '@/lib/sessionValidator';
import type { JsonSession } from '@/types/jsonSession';

interface SessionJsonInputProps {
  onValidSession: (session: JsonSession) => void;
  onCancel: () => void;
}

export function SessionJsonInput({ onValidSession, onCancel }: SessionJsonInputProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleValidate = () => {
    const result = validateSessionJson(jsonInput);
    setErrors(result.errors);
    setIsValid(result.valid);

    if (result.valid && result.session) {
      onValidSession(result.session);
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          const text = re.target?.result as string;
          setJsonInput(text);
          setErrors([]);
          setIsValid(null);
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background p-4"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Importer une séance</h1>
          <p className="text-sm text-muted-foreground">Colle ici le JSON de ta séance</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
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
            }}
            placeholder='{"session": {...}, "blocks": [...]}'
            className="min-h-[300px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Validation Result */}
      <AnimatePresence>
        {isValid === true && (
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
                      {error.path && (
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {error.path}
                        </span>
                      )}
                      <span>{error.message}</span>
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
