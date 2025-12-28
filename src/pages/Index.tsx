import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePresets } from '@/hooks/usePresets';
import { TimerPreset } from '@/types/timer';
import { TimerCard } from '@/components/TimerCard';
import { PresetForm } from '@/components/PresetForm';
import { RunScreen } from '@/components/RunScreen';
import { SettingsPage } from '@/components/SettingsPage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Timer, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportPreset, importPreset } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { audioManager } from '@/lib/audio';

type View = 'home' | 'new' | 'edit' | 'run' | 'settings';

const Index = () => {
  const { presets, addPreset, updatePreset, deletePreset, duplicatePreset, getPreset, importPresetFromJson } = usePresets();
  const [view, setView] = useState<View>('home');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [runningPreset, setRunningPreset] = useState<TimerPreset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Initialize audio on first interaction
  const handleFirstInteraction = useCallback(() => {
    audioManager.init();
    document.removeEventListener('click', handleFirstInteraction);
    document.removeEventListener('touchstart', handleFirstInteraction);
  }, []);

  useState(() => {
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
  });

  const handleStartPreset = useCallback((id: string) => {
    const preset = getPreset(id);
    if (preset) {
      setRunningPreset(preset);
      setView('run');
    }
  }, [getPreset]);

  const handleStartNew = useCallback((data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPreset = addPreset(data);
    setRunningPreset(newPreset);
    setView('run');
  }, [addPreset]);

  const handleSaveNew = useCallback((data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    addPreset(data);
    toast({ title: 'Timer enregistré' });
    setView('home');
  }, [addPreset]);

  const handleSaveEdit = useCallback((data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      updatePreset(editingId, data);
      toast({ title: 'Timer modifié' });
    }
    setEditingId(null);
    setView('home');
  }, [editingId, updatePreset]);

  const handleStartEdit = useCallback((data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      updatePreset(editingId, data);
      const preset = getPreset(editingId);
      if (preset) {
        setRunningPreset({ ...preset, ...data });
        setView('run');
      }
    }
  }, [editingId, updatePreset, getPreset]);

  const handleEditPreset = useCallback((id: string) => {
    setEditingId(id);
    setView('edit');
  }, []);

  const handleDuplicatePreset = useCallback((id: string) => {
    const dup = duplicatePreset(id);
    if (dup) {
      toast({ title: 'Timer dupliqué' });
    }
  }, [duplicatePreset]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmId) {
      deletePreset(deleteConfirmId);
      toast({ title: 'Timer supprimé' });
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deletePreset]);

  const handleExport = useCallback((id: string) => {
    const preset = getPreset(id);
    if (preset) {
      const json = exportPreset(preset);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${preset.name || 'timer'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [getPreset]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          const text = re.target?.result as string;
          const preset = importPreset(text);
          if (preset) {
            importPresetFromJson(preset);
            toast({ title: 'Timer importé' });
          } else {
            toast({ title: 'Erreur d\'import', variant: 'destructive' });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [importPresetFromJson]);

  const handleStopRun = useCallback(() => {
    setRunningPreset(null);
    setView('home');
  }, []);

  const editingPreset = editingId ? getPreset(editingId) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Timer className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Gym Timer</h1>
                    <p className="text-xs text-muted-foreground">Interval training</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setView('settings')}>
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </header>

            {/* Content */}
            <main className="p-4 pb-24 space-y-4">
              {presets.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <Timer className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Aucun timer
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Créez votre premier timer d'entraînement
                  </p>
                  <Button variant="default" size="lg" onClick={() => setView('new')}>
                    <Plus className="w-5 h-5" />
                    Créer un timer
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                      Mes timers ({presets.length})
                    </h2>
                    <Button variant="ghost" size="sm" onClick={handleImport}>
                      <Upload className="w-4 h-4" />
                      Importer
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {presets.map((preset) => (
                      <TimerCard
                        key={preset.id}
                        preset={preset}
                        onStart={handleStartPreset}
                        onEdit={handleEditPreset}
                        onDuplicate={handleDuplicatePreset}
                        onDelete={(id) => setDeleteConfirmId(id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </main>

            {/* FAB */}
            {presets.length > 0 && (
              <motion.div
                className="fixed bottom-6 right-4 safe-bottom"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <Button
                  variant="default"
                  size="xl"
                  onClick={() => setView('new')}
                  className="rounded-full shadow-2xl shadow-primary/30"
                >
                  <Plus className="w-6 h-6" />
                  Nouveau
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {view === 'new' && (
          <PresetForm
            key="new"
            onSave={handleSaveNew}
            onStart={handleStartNew}
            onBack={() => setView('home')}
          />
        )}

        {view === 'edit' && editingPreset && (
          <PresetForm
            key="edit"
            preset={editingPreset}
            onSave={handleSaveEdit}
            onStart={handleStartEdit}
            onBack={() => {
              setEditingId(null);
              setView('home');
            }}
          />
        )}

        {view === 'run' && runningPreset && (
          <RunScreen
            key="run"
            preset={runningPreset}
            onStop={handleStopRun}
          />
        )}

        {view === 'settings' && (
          <SettingsPage key="settings" onBack={() => setView('home')} />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Supprimer ce timer ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default Index;
