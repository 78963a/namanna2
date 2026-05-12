
/// <reference types="vite/client" />

/**
 * Service for handling sound effects and managing audio logic.
 */
class SoundService {
  private isUnlocked: boolean = false;
  private audioCache: { [path: string]: HTMLAudioElement } = {};
  private activeCount: number = 0;

  /**
   * Resolves the full path for an asset, taking BASE_URL into account.
   */
  private getFullPath(path: string): string {
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    // In Vite, import.meta.env.BASE_URL is usually available
    const baseUrl = (import.meta.env && import.meta.env.BASE_URL) || '/';
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    
    const result = baseUrl.endsWith('/') ? `${baseUrl}${normalizedPath}` : `${baseUrl}/${normalizedPath}`;
    return result;
  }

  /**
   * Returns whether any sound is currently playing.
   */
  get isPlaying(): boolean {
    return this.activeCount > 0;
  }

  /**
   * Preloads an audio file and caches it.
   */
  preload(path: string) {
    const fullPath = this.getFullPath(path);
    if (this.audioCache[fullPath]) return;
    const audio = new Audio(fullPath);
    audio.load();
    this.audioCache[fullPath] = audio;
  }

  /**
   * Unlocks the audio context. Should be called on user interaction.
   */
  unlock() {
    if (this.isUnlocked) return;
    
    // Create a silent dummy sound to unlock audio context on mobile/safari
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    silentAudio.play().then(() => {
      this.isUnlocked = true;
    }).catch(e => {
      console.log('Sound unlock failed:', e);
    });
  }

  /**
   * Plays a sound effect.
   */
  play(path: string, isEnabled: boolean = true) {
    if (isEnabled === false) return;

    const fullPath = this.getFullPath(path);

    try {
      let audio = this.audioCache[fullPath];
      if (!audio) {
        audio = new Audio(fullPath);
        audio.preload = 'auto';
        this.audioCache[fullPath] = audio;
      }
      
      audio.currentTime = 0;
      
      const onEnd = () => {
        this.activeCount = Math.max(0, this.activeCount - 1);
        audio.removeEventListener('ended', onEnd);
      };
      
      audio.addEventListener('ended', onEnd);
      this.activeCount++;

      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          this.activeCount = Math.max(0, this.activeCount - 1);
          audio.removeEventListener('ended', onEnd);
          console.warn('Sound playback failed:', e, 'Path:', fullPath);
        });
      }
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }
}

export const soundService = new SoundService();
