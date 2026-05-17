
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
    
    // Some browsers require the audio context to be resumed
    const resumeContext = () => {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.volume = 0; // Ensure it's silent
      
      silentAudio.play().then(() => {
        this.isUnlocked = true;
        console.log('Sound Service: Audio context unlocked successfully');
      }).catch(e => {
        console.warn('Sound Service: Initial unlock failed, will retry on next play', e);
      });
    };

    resumeContext();
  }

  /**
   * Immediately stops all ongoing sounds.
   */
  stop() {
    Object.values(this.audioCache).forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {
        // Ignore errors if audio was already stopped or not loaded
      }
    });
    this.activeCount = 0;
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
      
      const onEnd = () => {
        this.activeCount = Math.max(0, this.activeCount - 1);
        audio.removeEventListener('ended', onEnd);
        audio.removeEventListener('error', onErr);
        if (this.activeCount === 0 && 'mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none';
        }
      };

      const onErr = (e: any) => {
        console.error('Sound Service: Audio error event:', e, 'Path:', fullPath);
        onEnd();
      };
      
      audio.addEventListener('ended', onEnd);
      audio.addEventListener('error', onErr);
      
      audio.currentTime = 0;
      this.activeCount++;

      // Media Session Support
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'playing';
        } catch (e) {}
      }

      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          onEnd();
          console.warn('Sound Service: Playback failed (likely auto-play policy):', e, 'Path:', fullPath);
          
          // Re-attempt unlock if failed
          if (!this.isUnlocked) {
            this.unlock();
          }
        });
      }
    } catch (e) {
      console.error('Sound Service: Exception during play:', e);
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
  }
}

export const soundService = new SoundService();
