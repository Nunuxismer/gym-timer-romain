class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'wakeLock' in navigator;
  }

  async acquire(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Wake Lock API not supported');
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
      });

      // Re-acquire on visibility change
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      
      console.log('Wake Lock acquired');
      return true;
    } catch (err) {
      console.error('Wake Lock error:', err);
      return false;
    }
  }

  private handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && this.isSupported) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.error('Wake Lock reacquire error:', err);
      }
    }
  };

  async release(): Promise<void> {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
      } catch (err) {
        console.error('Wake Lock release error:', err);
      }
    }
  }

  getIsSupported(): boolean {
    return this.isSupported;
  }
}

export const wakeLockManager = new WakeLockManager();
