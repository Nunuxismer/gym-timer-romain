class HapticsManager {
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private vibrate(pattern: number | number[]) {
    if (!this.enabled) return;
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  light() {
    this.vibrate(10);
  }

  medium() {
    this.vibrate(25);
  }

  heavy() {
    this.vibrate(50);
  }

  success() {
    this.vibrate([50, 50, 50]);
  }

  warning() {
    this.vibrate([100, 50, 100]);
  }

  phaseChange() {
    this.vibrate([30, 30, 30]);
  }

  countdown() {
    this.vibrate(15);
  }
}

export const haptics = new HapticsManager();
