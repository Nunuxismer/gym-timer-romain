import { useState, useCallback } from 'react';
import { usePresets } from '@/hooks/usePresets';
import { useRestPresets } from '@/hooks/useRestPresets';
import { useJsonSessions } from '@/hooks/useJsonSessions';
import { TimerPreset } from '@/types/timer';
import { RestTimerPreset } from '@/types/restTimer';
import type { StoredSession } from '@/types/jsonSession';
import { TimerCard } from '@/components/TimerCard';
import { RestTimerCard } from '@/components/RestTimerCard';
import { PresetForm } from '@/components/PresetForm';
import { RestTimerForm } from '@/components/RestTimerForm';
import { RunScreen } from '@/components/RunScreen';
import { RestTimerRunScreen } from '@/components/RestTimerRunScreen';
import { SettingsPage } from '@/components/SettingsPage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TabLink } from '@/components/TabLink';
import { SessionList } from '@/components/session/SessionList';
import { SessionJsonInput } from '@/components/session/SessionJsonInput';
import { SessionDetail } from '@/components/session/SessionDetail';
import { SessionRunScreen } from '@/components/session/SessionRunScreen';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Timer, Dumbbell, FileJson, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { importPreset } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { audioManager } from '@/lib/audio';

type TimerType = 'emom' | 'rest' | 'json';
type View = 'home' | 'new' | 'edit' | 'run' | 'settings' | 'json-import' | 'json-detail' | 'json-run';

const Index = () => {
  // EMOM presets
  const { presets: emomPresets, addPreset: addEmomPreset, updatePreset: updateEmomPreset, deletePreset: deleteEmomPreset, duplicatePreset: duplicateEmomPreset, getPreset: getEmomPreset, importPresetFromJson } = usePresets();
  
  // Rest presets
  const { presets: restPresets, addPreset: addRestPreset, updatePreset: updateRestPreset, deletePreset: deleteRestPreset, getPreset: getRestPreset } = useRestPresets();

  // JSON sessions
  const { 
    sessions: jsonSessions, 
    importFromJson, 
    deleteSession: deleteJsonSession, 
    getSession: getJsonSession,
    markSessionRun 
  } = useJsonSessions();

  const [timerType, setTimerType] = useState<TimerType>('emom');
  const [view, setView] = useState<View>('home');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [runningEmomPreset, setRunningEmomPreset] = useState<TimerPreset | null>(null);
  const [runningRestPreset, setRunningRestPreset] = useState<Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [selectedJsonSession, setSelectedJsonSession] = useState<StoredSession | null>(null);
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

  // EMOM handlers
  const handleStartEmomPreset = useCallback((id: string) => {
    const preset = getEmomPreset(id);
    if (preset) {
      setRunningEmomPreset(preset);
      setView('run');
    }
  }, [getEmomPreset]);

  const handleStartNewEmom = useCallback((data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPreset = addEmomPreset(data);
    setRunningEmomPreset(newPreset);
    setView('run');
  }, [addEmomPreset]);

  const handleSaveNewEmom = useCallback((data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    addEmomPreset(data);
    toast({ title: 'Timer enregistré' });
    setView('home');
  }, [addEmomPreset]);

  const handleSaveEditEmom = useCallback((data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      updateEmomPreset(editingId, data);
      toast({ title: 'Timer modifié' });
    }
    setEditingId(null);
    setView('home');
  }, [editingId, updateEmomPreset]);

  const handleStartEditEmom = useCallback((data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      updateEmomPreset(editingId, data);
      const preset = getEmomPreset(editingId);
      if (preset) {
        setRunningEmomPreset({ ...preset, ...data });
        setView('run');
      }
    }
  }, [editingId, updateEmomPreset, getEmomPreset]);

  const handleEditEmomPreset = useCallback((id: string) => {
    setEditingId(id);
    setView('edit');
  }, []);

  const handleDuplicateEmomPreset = useCallback((id: string) => {
    const dup = duplicateEmomPreset(id);
    if (dup) {
      toast({ title: 'Timer dupliqué' });
    }
  }, [duplicateEmomPreset]);

  // Rest handlers
  const handleStartRestPreset = useCallback((id: string) => {
    const preset = getRestPreset(id);
    if (preset) {
      setRunningRestPreset(preset);
      setView('run');
    }
  }, [getRestPreset]);

  const handleStartNewRest = useCallback((data: Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    addRestPreset(data);
    setRunningRestPreset(data);
    setView('run');
  }, [addRestPreset]);

  const handleSaveNewRest = useCallback((data: Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    addRestPreset(data);
    toast({ title: 'Timer repos enregistré' });
    setView('home');
  }, [addRestPreset]);

  const handleSaveEditRest = useCallback((data: Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      updateRestPreset(editingId, data);
      toast({ title: 'Timer modifié' });
    }
    setEditingId(null);
    setView('home');
  }, [editingId, updateRestPreset]);

  const handleStartEditRest = useCallback((data: Omit<RestTimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingId) {
      updateRestPreset(editingId, data);
      setRunningRestPreset(data);
      setView('run');
    }
  }, [editingId, updateRestPreset]);

  const handleEditRestPreset = useCallback((id: string) => {
    setEditingId(id);
    setView('edit');
  }, []);

  // JSON Session handlers
  const handleJsonImportSuccess = useCallback((session: StoredSession) => {
    toast({ title: 'Séance importée avec succès' });
    setView('home');
  }, []);

  const handleViewJsonSession = useCallback((sessionId: string) => {
    const session = getJsonSession(sessionId);
    if (session) {
      setSelectedJsonSession(session);
      setView('json-detail');
    }
  }, [getJsonSession]);

  const handleStartJsonSession = useCallback((sessionId: string) => {
    const session = getJsonSession(sessionId);
    if (session) {
      setSelectedJsonSession(session);
      markSessionRun(sessionId);
      setView('json-run');
    }
  }, [getJsonSession, markSessionRun]);

  const handleDeleteJsonSession = useCallback((sessionId: string) => {
    setDeleteConfirmId(sessionId);
  }, []);

  // Common handlers
  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmId) {
      if (timerType === 'emom') {
        deleteEmomPreset(deleteConfirmId);
        toast({ title: 'Timer supprimé' });
      } else if (timerType === 'rest') {
        deleteRestPreset(deleteConfirmId);
        toast({ title: 'Timer supprimé' });
      } else if (timerType === 'json') {
        deleteJsonSession(deleteConfirmId);
        toast({ title: 'Séance supprimée' });
      }
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, timerType, deleteEmomPreset, deleteRestPreset, deleteJsonSession]);

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
    setRunningEmomPreset(null);
    setRunningRestPreset(null);
    setSelectedJsonSession(null);
    setView('home');
  }, []);

  const editingEmomPreset = editingId && timerType === 'emom' ? getEmomPreset(editingId) : undefined;
  const editingRestPreset = editingId && timerType === 'rest' ? getRestPreset(editingId) : undefined;

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
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Timer className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Gym Timer</h1>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setView('settings')}>
                  <Settings className="w-5 h-5" />
                </Button>
              </div>

              {/* Navigation tabs */}
              <div className="flex border-t border-border">
                <TabLink
                  active={timerType === 'emom'}
                  onClick={() => setTimerType('emom')}
                  icon={<Timer className="w-4 h-4" />}
                >
                  EMOM
                </TabLink>
                <TabLink
                  active={timerType === 'rest'}
                  onClick={() => setTimerType('rest')}
                  icon={<Dumbbell className="w-4 h-4" />}
                >
                  Repos
                </TabLink>
                <TabLink
                  active={timerType === 'json'}
                  onClick={() => setTimerType('json')}
                  icon={<FileJson className="w-4 h-4" />}
                >
                  Séances
                </TabLink>
              </div>
            </header>

            {/* Content */}
            <main className="p-4 pb-24 space-y-4">
              <AnimatePresence mode="wait">
                {timerType === 'emom' && (
                  <motion.div
                    key="emom-list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    {emomPresets.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                          <Timer className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Aucun timer EMOM
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          Créez votre premier timer d'interval training
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
                            Mes timers ({emomPresets.length})
                          </h2>
                          <Button variant="ghost" size="sm" onClick={handleImport}>
                            <Upload className="w-4 h-4" />
                            Importer
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {emomPresets.map((preset) => (
                            <TimerCard
                              key={preset.id}
                              preset={preset}
                              onStart={handleStartEmomPreset}
                              onEdit={handleEditEmomPreset}
                              onDuplicate={handleDuplicateEmomPreset}
                              onDelete={(id) => setDeleteConfirmId(id)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {timerType === 'rest' && (
                  <motion.div
                    key="rest-list"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {restPresets.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                          <Dumbbell className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Aucun timer repos
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          Créez un timer pour gérer vos temps de repos
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
                            Mes timers repos ({restPresets.length})
                          </h2>
                        </div>
                        <div className="space-y-3">
                          {restPresets.map((preset) => (
                            <RestTimerCard
                              key={preset.id}
                              preset={preset}
                              onStart={() => handleStartRestPreset(preset.id)}
                              onEdit={() => handleEditRestPreset(preset.id)}
                              onDelete={() => setDeleteConfirmId(preset.id)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {timerType === 'json' && (
                  <motion.div
                    key="json-list"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <SessionList
                      sessions={jsonSessions}
                      onView={handleViewJsonSession}
                      onStart={handleStartJsonSession}
                      onDelete={handleDeleteJsonSession}
                      onImport={() => setView('json-import')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* FAB - only for emom and rest */}
            {(timerType === 'emom' || timerType === 'rest') && (
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

        {/* EMOM New/Edit/Run */}
        {view === 'new' && timerType === 'emom' && (
          <PresetForm
            key="new-emom"
            onSave={handleSaveNewEmom}
            onStart={handleStartNewEmom}
            onBack={() => setView('home')}
          />
        )}

        {view === 'edit' && timerType === 'emom' && editingEmomPreset && (
          <PresetForm
            key="edit-emom"
            preset={editingEmomPreset}
            onSave={handleSaveEditEmom}
            onStart={handleStartEditEmom}
            onBack={() => {
              setEditingId(null);
              setView('home');
            }}
          />
        )}

        {view === 'run' && runningEmomPreset && (
          <RunScreen
            key="run-emom"
            preset={runningEmomPreset}
            onStop={handleStopRun}
          />
        )}

        {/* Rest New/Edit/Run */}
        {view === 'new' && timerType === 'rest' && (
          <RestTimerForm
            key="new-rest"
            onSave={handleSaveNewRest}
            onStart={handleStartNewRest}
            onBack={() => setView('home')}
          />
        )}

        {view === 'edit' && timerType === 'rest' && editingRestPreset && (
          <RestTimerForm
            key="edit-rest"
            preset={editingRestPreset}
            onSave={handleSaveEditRest}
            onStart={handleStartEditRest}
            onBack={() => {
              setEditingId(null);
              setView('home');
            }}
          />
        )}

        {view === 'run' && runningRestPreset && (
          <RestTimerRunScreen
            key="run-rest"
            preset={runningRestPreset}
            onBack={handleStopRun}
          />
        )}

        {/* JSON Session Import/Detail/Run */}
        {view === 'json-import' && (
          <SessionJsonInput
            key="json-import"
            onImport={importFromJson}
            onSuccess={handleJsonImportSuccess}
            onBack={() => setView('home')}
          />
        )}

        {view === 'json-detail' && selectedJsonSession && (
          <SessionDetail
            key="json-detail"
            session={selectedJsonSession}
            onBack={() => {
              setSelectedJsonSession(null);
              setView('home');
            }}
            onStart={() => {
              markSessionRun(selectedJsonSession.session.session_id);
              setView('json-run');
            }}
          />
        )}

        {view === 'json-run' && selectedJsonSession && (
          <SessionRunScreen
            key="json-run"
            session={selectedJsonSession}
            onBack={handleStopRun}
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
        title={timerType === 'json' ? "Supprimer cette séance ?" : "Supprimer ce timer ?"}
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default Index;
