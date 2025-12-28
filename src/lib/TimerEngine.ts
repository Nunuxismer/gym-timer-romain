import { TimerPreset, TimerState, TimerPhase } from '@/types/timer';
import { audioManager } from './audio';
import { haptics } from './haptics';

type TimerCallback = (state: TimerState) => void;

export class TimerEngine {
  private preset: TimerPreset;
  private state: TimerState;
  private callback: TimerCallback;
  private lastTick: number = 0;
  private animationFrameId: number | null = null;
  private accumulatedTime: number = 0;
  private lastAnnouncedSecond: number = -1;
  private backgroundStartTime: number | null = null;

  constructor(preset: TimerPreset, callback: TimerCallback) {
    this.preset = preset;
    this.callback = callback;
    this.state = this.createInitialState();
    
    // Configure audio
    audioManager.setVolume(preset.volume);
    audioManager.setSoundSet(preset.soundSet);

    // Listen for visibility changes to handle background timing
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private createInitialState(): TimerState {
    return {
      phase: 'idle',
      currentCycle: 0,
      totalCycles: this.preset.cycles,
      timeRemaining: 0,
      timeElapsed: 0,
      phaseDuration: 0,
      isRunning: false,
      isPaused: false,
    };
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && this.state.isRunning) {
      // Going to background - store the timestamp
      this.backgroundStartTime = performance.now();
    } else if (document.visibilityState === 'visible' && this.backgroundStartTime !== null) {
      // Coming back from background - calculate elapsed time
      const elapsedInBackground = performance.now() - this.backgroundStartTime;
      this.accumulatedTime += elapsedInBackground;
      this.backgroundStartTime = null;
      
      // Resync the timer
      if (this.state.isRunning) {
        this.processElapsedTime(elapsedInBackground);
      }
    }
  };

  private processElapsedTime(elapsed: number) {
    // Fast-forward through phases if needed
    let remainingElapsed = elapsed;
    
    while (remainingElapsed > 0 && this.state.phase !== 'complete') {
      const timeToAdvance = Math.min(remainingElapsed, this.state.timeRemaining);
      this.state.timeRemaining -= timeToAdvance;
      this.state.timeElapsed += timeToAdvance;
      remainingElapsed -= timeToAdvance;

      if (this.state.timeRemaining <= 0) {
        this.advancePhase();
      }
    }
    
    this.callback(this.state);
  }

  start() {
    if (this.state.phase === 'idle' || this.state.phase === 'complete') {
      this.state = {
        ...this.createInitialState(),
        phase: 'preparation',
        timeRemaining: this.preset.preparationSeconds * 1000,
        phaseDuration: this.preset.preparationSeconds * 1000,
        isRunning: true,
        currentCycle: 1,
      };
      
      this.announcePhase('preparation');
      audioManager.playPhaseChange('preparation');
      haptics.phaseChange();
    } else {
      this.state.isRunning = true;
      this.state.isPaused = false;
    }

    this.lastTick = performance.now();
    this.accumulatedTime = 0;
    this.lastAnnouncedSecond = -1;
    this.tick();
    this.callback(this.state);
  }

  pause() {
    this.state.isRunning = false;
    this.state.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.callback(this.state);
  }

  resume() {
    if (this.state.isPaused) {
      this.state.isRunning = true;
      this.state.isPaused = false;
      this.lastTick = performance.now();
      this.tick();
      this.callback(this.state);
    }
  }

  skip() {
    if (this.state.phase !== 'idle' && this.state.phase !== 'complete') {
      this.advancePhase();
      this.callback(this.state);
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.state = this.createInitialState();
    this.callback(this.state);
  }

  destroy() {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  getState(): TimerState {
    return { ...this.state };
  }

  private tick = () => {
    if (!this.state.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTick;
    this.lastTick = now;

    this.state.timeRemaining -= delta;
    this.state.timeElapsed += delta;

    // Check for countdown beeps and announcements
    const secondsRemaining = Math.ceil(this.state.timeRemaining / 1000);
    
    if (secondsRemaining !== this.lastAnnouncedSecond && secondsRemaining > 0) {
      this.lastAnnouncedSecond = secondsRemaining;
      
      // Beep on last 3 seconds
      if (this.preset.beepLastThree && secondsRemaining <= 3) {
        audioManager.playCountdownBeep();
        haptics.countdown();
      }

      // Announce "dernières secondes" at 5 seconds
      if (this.preset.voiceAnnounce && secondsRemaining === 5 && this.state.phase !== 'preparation') {
        audioManager.announceLastSeconds();
      }
    }

    if (this.state.timeRemaining <= 0) {
      this.advancePhase();
    }

    this.callback(this.state);

    if (this.state.isRunning && this.state.phase !== 'complete') {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  };

  private advancePhase() {
    const { phase, currentCycle, totalCycles } = this.state;
    this.lastAnnouncedSecond = -1;

    switch (phase) {
      case 'preparation':
        // Start first activity
        this.state.phase = 'activity';
        this.state.phaseDuration = this.preset.activitySeconds * 1000;
        this.state.timeRemaining = this.preset.activitySeconds * 1000;
        this.state.timeElapsed = 0;
        this.announcePhase('activity');
        audioManager.playPhaseChange('activity');
        haptics.phaseChange();
        break;

      case 'activity':
        // Go to rest
        this.state.phase = 'rest';
        this.state.phaseDuration = this.preset.restSeconds * 1000;
        this.state.timeRemaining = this.preset.restSeconds * 1000;
        this.state.timeElapsed = 0;
        this.announcePhase('rest');
        audioManager.playPhaseChange('rest');
        haptics.phaseChange();
        break;

      case 'rest':
        if (currentCycle >= totalCycles) {
          // Complete!
          this.state.phase = 'complete';
          this.state.isRunning = false;
          this.state.timeRemaining = 0;
          audioManager.playComplete();
          haptics.success();
          if (this.preset.voiceAnnounce) {
            audioManager.announceComplete();
          }
        } else {
          // Next cycle
          this.state.currentCycle++;
          this.state.phase = 'activity';
          this.state.phaseDuration = this.preset.activitySeconds * 1000;
          this.state.timeRemaining = this.preset.activitySeconds * 1000;
          this.state.timeElapsed = 0;
          this.announcePhase('activity');
          audioManager.playPhaseChange('activity');
          haptics.phaseChange();
        }
        break;
    }
  }

  private announcePhase(phase: 'preparation' | 'activity' | 'rest') {
    if (this.preset.voiceAnnounce) {
      audioManager.announcePhase(
        phase,
        this.state.currentCycle,
        this.state.totalCycles
      );
    }
  }
}
