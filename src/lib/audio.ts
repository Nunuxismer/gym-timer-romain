type SoundType = 'countdown' | 'phaseChange' | 'complete' | 'tick';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private volume = 0.8;
  private soundSet: 'beep' | 'bell' = 'beep';

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (iOS requirement)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setSoundSet(set: 'beep' | 'bell') {
    this.soundSet = set;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  playCountdownBeep() {
    if (this.soundSet === 'beep') {
      this.playTone(880, 0.15, 'square');
    } else {
      this.playTone(1200, 0.2, 'sine');
    }
  }

  playPhaseChange(phase: 'preparation' | 'activity' | 'rest') {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    if (this.soundSet === 'beep') {
      // Double beep for phase change
      const freq = phase === 'activity' ? 660 : phase === 'rest' ? 440 : 550;
      this.playTone(freq, 0.15);
      setTimeout(() => this.playTone(freq * 1.2, 0.2), 150);
    } else {
      // Bell sound
      const freq = phase === 'activity' ? 800 : phase === 'rest' ? 600 : 700;
      this.playTone(freq, 0.4, 'sine');
    }
  }

  playComplete() {
    // Victory fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3), i * 150);
    });
  }

  // Voice synthesis
  speak(text: string, priority: boolean = false): void {
    if (!('speechSynthesis' in window)) return;

    if (priority) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    utterance.volume = this.volume;
    utterance.lang = 'fr-FR';

    speechSynthesis.speak(utterance);
  }

  announcePhase(phase: 'preparation' | 'activity' | 'rest', cycle?: number, totalCycles?: number) {
    let text = '';
    switch (phase) {
      case 'preparation':
        text = 'Préparation';
        break;
      case 'activity':
        text = cycle !== undefined && totalCycles !== undefined
          ? `Activité. Cycle ${cycle} sur ${totalCycles}`
          : 'Activité';
        break;
      case 'rest':
        text = 'Repos';
        break;
    }
    this.speak(text, true);
  }

  announceComplete() {
    this.speak('Terminé! Excellent travail!', true);
  }

  announceLastSeconds() {
    this.speak('Dernières secondes', false);
  }

  // Initialize audio context on user interaction
  init() {
    this.getContext();
  }
}

export const audioManager = new AudioManager();
