import { useState, useEffect } from 'react';
import { TimerPreset, DEFAULT_PRESET, ActivityMode } from '@/types/timer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Save, Play, ArrowLeft, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { audioManager } from '@/lib/audio';

interface PresetFormProps {
  preset?: TimerPreset;
  onSave: (data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onStart: (data: Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBack: () => void;
}

export function PresetForm({ preset, onSave, onStart, onBack }: PresetFormProps) {
  const [name, setName] = useState(preset?.name || '');
  const [preparationSeconds, setPreparationSeconds] = useState(preset?.preparationSeconds ?? DEFAULT_PRESET.preparationSeconds);
  const [activitySeconds, setActivitySeconds] = useState(preset?.activitySeconds ?? DEFAULT_PRESET.activitySeconds);
  const [activityMode, setActivityMode] = useState<ActivityMode>(preset?.activityMode ?? DEFAULT_PRESET.activityMode);
  const [restSeconds, setRestSeconds] = useState(preset?.restSeconds ?? DEFAULT_PRESET.restSeconds);
  const [cycles, setCycles] = useState(preset?.cycles ?? DEFAULT_PRESET.cycles);
  const [beepLastThree, setBeepLastThree] = useState(preset?.beepLastThree ?? DEFAULT_PRESET.beepLastThree);
  const [voiceAnnounce, setVoiceAnnounce] = useState(preset?.voiceAnnounce ?? DEFAULT_PRESET.voiceAnnounce);
  const [soundSet, setSoundSet] = useState<'beep' | 'bell'>(preset?.soundSet ?? DEFAULT_PRESET.soundSet);
  const [volume, setVolume] = useState(preset?.volume ?? DEFAULT_PRESET.volume);

  const getFormData = (): Omit<TimerPreset, 'id' | 'createdAt' | 'updatedAt'> => ({
    name: name || 'Timer sans nom',
    preparationSeconds,
    activitySeconds,
    activityMode,
    restSeconds,
    cycles,
    beepLastThree,
    voiceAnnounce,
    soundSet,
    volume,
  });

  const handleSave = () => {
    onSave(getFormData());
  };

  const handleStart = () => {
    onStart(getFormData());
  };

  const testSound = () => {
    audioManager.setVolume(volume);
    audioManager.setSoundSet(soundSet);
    audioManager.init();
    audioManager.playCountdownBeep();
  };

  const TimeInput = ({ 
    label, 
    value, 
    onChange, 
    color 
  }: { 
    label: string; 
    value: number; 
    onChange: (v: number) => void;
    color: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.max(5, value - 5))}
          className="shrink-0"
        >
          -5
        </Button>
        <div className={`flex-1 text-center font-display text-4xl ${color}`}>
          {Math.floor(value / 60)}:{(value % 60).toString().padStart(2, '0')}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.min(600, value + 5))}
          className="shrink-0"
        >
          +5
        </Button>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={5}
        max={300}
        step={5}
        className="mt-2"
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold flex-1">
            {preset ? 'Modifier le timer' : 'Nouveau timer'}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom du timer</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: HIIT Tabata, EMOM 30/30..."
            className="h-12 text-base"
          />
        </div>

        {/* Preparation */}
        <TimeInput
          label="⏱️ Préparation"
          value={preparationSeconds}
          onChange={setPreparationSeconds}
          color="phase-prep"
        />

        {/* Activity */}
        <div className="space-y-3">
          <TimeInput
            label="🔥 Activité"
            value={activitySeconds}
            onChange={setActivitySeconds}
            color="phase-activity"
          />
          <div className="flex gap-2">
            <Button
              variant={activityMode === 'countdown' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivityMode('countdown')}
              className="flex-1"
            >
              Décompte ↓
            </Button>
            <Button
              variant={activityMode === 'countup' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivityMode('countup')}
              className="flex-1"
            >
              Chrono ↑
            </Button>
          </div>
        </div>

        {/* Rest */}
        <TimeInput
          label="💤 Repos"
          value={restSeconds}
          onChange={setRestSeconds}
          color="phase-rest"
        />

        {/* Cycles */}
        <div className="space-y-2">
          <Label>🔁 Nombre de cycles</Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCycles(Math.max(1, cycles - 1))}
            >
              -
            </Button>
            <div className="flex-1 text-center font-display text-5xl text-foreground">
              {cycles}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCycles(Math.min(99, cycles + 1))}
            >
              +
            </Button>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="space-y-4 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Sons & Voix
          </h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="beep">Bip 3...2...1</Label>
            <Switch
              id="beep"
              checked={beepLastThree}
              onCheckedChange={setBeepLastThree}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="voice">Annonce vocale</Label>
            <Switch
              id="voice"
              checked={voiceAnnounce}
              onCheckedChange={setVoiceAnnounce}
            />
          </div>

          <div className="space-y-2">
            <Label>Set de sons</Label>
            <div className="flex gap-2">
              <Button
                variant={soundSet === 'beep' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSoundSet('beep')}
                className="flex-1"
              >
                Beep
              </Button>
              <Button
                variant={soundSet === 'bell' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSoundSet('bell')}
                className="flex-1"
              >
                Cloche
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Volume</Label>
              <Button variant="ghost" size="sm" onClick={testSound}>
                Tester
              </Button>
            </div>
            <Slider
              value={[volume]}
              onValueChange={([v]) => setVolume(v)}
              min={0}
              max={1}
              step={0.1}
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSave}
            className="flex-1"
          >
            <Save className="w-5 h-5" />
            Enregistrer
          </Button>
          <Button
            variant="timerStart"
            size="lg"
            onClick={handleStart}
            className="flex-1"
          >
            <Play className="w-5 h-5" />
            Démarrer
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
