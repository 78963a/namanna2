
/// <reference types="vite/client" />

/**
 * Service for handling sound effects and managing audio logic.
 */
class SoundService {
  private isUnlocked: boolean = false;
  private isUnlocking: boolean = false;
  private audioCache: { [path: string]: HTMLAudioElement } = {};
  private activeCount: number = 0;

  /**
   * Resolves the full path for an asset, taking BASE_URL into account.
   */
  private getFullPath(path: string): string {
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    const baseUrl = (import.meta.env && import.meta.env.BASE_URL) || '/';
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    
    return baseUrl.endsWith('/') ? `${baseUrl}${normalizedPath}` : `${baseUrl}/${normalizedPath}`;
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
    audio.preload = 'auto';
    audio.load();
    this.audioCache[fullPath] = audio;
  }

  /**
   * Unlocks the audio context. Should be called on user interaction.
   */
  unlock() {
    if (this.isUnlocked || this.isUnlocking) return;
    
    this.isUnlocking = true;

    // Use a truly silent, minimal base64 wav
    // This one is known to be stable silence
    const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    silentAudio.volume = 0;
    silentAudio.muted = true;
    
    silentAudio.play().then(() => {
      this.isUnlocked = true;
      this.isUnlocking = false;
      console.log('Sound Service: Audio context unlocked successfully');
    }).catch(e => {
      this.isUnlocking = false;
      console.warn('Sound Service: Initial unlock failed, will retry on next play', e);
    });
  }

  /**
   * Re-loads an audio file to ensure it's ready.
   */
  refresh(path: string) {
    const fullPath = this.getFullPath(path);
    const audio = this.audioCache[fullPath];
    if (audio) {
      audio.load();
    } else {
      this.preload(path);
    }
  }

  /**
   * Immediately stops all ongoing sounds.
   */
  stop() {
    Object.values(this.audioCache).forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
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
      
      // If the audio was preloaded a long time ago or hasn't loaded enough data, re-load it
      if (audio.readyState < 2) { // HAVE_CURRENT_DATA
        audio.load();
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
