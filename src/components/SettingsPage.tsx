import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Volume2, Vibrate, Palette, Download, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { audioManager } from '@/lib/audio';
import { wakeLockManager } from '@/lib/wakeLock';

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { settings, updateSettings } = useSettings();

  const testSound = () => {
    audioManager.setVolume(settings.defaultVolume);
    audioManager.setSoundSet(settings.defaultSoundSet);
    audioManager.init();
    audioManager.playCountdownBeep();
  };

  const testVoice = () => {
    audioManager.setVolume(settings.defaultVolume);
    audioManager.speak('Test de la synthèse vocale. Prêt pour l\'entraînement!');
  };

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
          <h1 className="text-xl font-semibold">Réglages</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Theme */}
        <section className="space-y-4 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Apparence
          </h3>

          <div className="space-y-2">
            <Label>Thème</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={settings.theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ theme: 'dark' })}
              >
                Sombre
              </Button>
              <Button
                variant={settings.theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ theme: 'light' })}
              >
                Clair
              </Button>
              <Button
                variant={settings.theme === 'gym' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ theme: 'gym' })}
              >
                Salle
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le mode "Salle" offre un contraste ultra-élevé pour une meilleure visibilité.
            </p>
          </div>
        </section>

        {/* Audio */}
        <section className="space-y-4 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio par défaut
          </h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="defaultBeep">Bip 3...2...1</Label>
            <Switch
              id="defaultBeep"
              checked={settings.defaultBeepLastThree}
              onCheckedChange={(v) => updateSettings({ defaultBeepLastThree: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="defaultVoice">Annonce vocale</Label>
            <Switch
              id="defaultVoice"
              checked={settings.defaultVoiceAnnounce}
              onCheckedChange={(v) => updateSettings({ defaultVoiceAnnounce: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Set de sons par défaut</Label>
            <div className="flex gap-2">
              <Button
                variant={settings.defaultSoundSet === 'beep' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ defaultSoundSet: 'beep' })}
                className="flex-1"
              >
                Beep
              </Button>
              <Button
                variant={settings.defaultSoundSet === 'bell' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ defaultSoundSet: 'bell' })}
                className="flex-1"
              >
                Cloche
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Volume par défaut</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.defaultVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.defaultVolume]}
              onValueChange={([v]) => updateSettings({ defaultVolume: v })}
              min={0}
              max={1}
              step={0.1}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={testSound} className="flex-1">
              Tester son
            </Button>
            <Button variant="outline" size="sm" onClick={testVoice} className="flex-1">
              Tester voix
            </Button>
          </div>
        </section>

        {/* Haptics */}
        <section className="space-y-4 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Vibrate className="w-5 h-5" />
            Vibrations
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="haptic">Retour haptique</Label>
              <p className="text-xs text-muted-foreground">
                Vibrations aux changements de phase
              </p>
            </div>
            <Switch
              id="haptic"
              checked={settings.hapticFeedback}
              onCheckedChange={(v) => updateSettings({ hapticFeedback: v })}
            />
          </div>
        </section>

        {/* Info */}
        <section className="space-y-3 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-foreground">À propos</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Screen Wake Lock:</strong>{' '}
              {wakeLockManager.getIsSupported() 
                ? '✅ Supporté' 
                : '❌ Non supporté - Désactivez la veille automatique dans vos paramètres'}
            </p>
            <p>
              <strong>Synthèse vocale:</strong>{' '}
              {'speechSynthesis' in window 
                ? '✅ Supportée' 
                : '❌ Non supportée'}
            </p>
            <p className="text-xs mt-4">
              Gym Interval Timer v1.0<br />
              Optimisé pour iPhone 13 Pro Max
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
