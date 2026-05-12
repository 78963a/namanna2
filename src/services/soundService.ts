
/**
 * Service for handling sound effects and managing audio logic.
 */
class SoundService {
  private isUnlocked: boolean = false;
  private audioCache: { [path: string]: HTMLAudioElement } = {};

  /**
   * Preloads an audio file and caches it.
   * @param path The path to the audio file.
   */
  preload(path: string) {
    if (this.audioCache[path]) return;
    const audio = new Audio(path);
    audio.load();
    this.audioCache[path] = audio;
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
      console.log('Sound context unlocked');
    }).catch(e => {
      console.log('Sound unlock failed (expected if no gesture yet):', e);
    });
  }

  /**
   * Plays a sound effect.
   * @param path The path to the audio file.
   * @param isEnabled Whether sounds are enabled.
   */
  play(path: string, isEnabled: boolean = true) {
    // If undefined, we treat it as enabled for these specific sound effects 
    // unless the user explicitly turned it off.
    if (isEnabled === false) return;

    try {
      let audio = this.audioCache[path];
      if (!audio) {
        audio = new Audio(path);
        audio.preload = 'auto'; // Force preload
        this.audioCache[path] = audio;
      }
      
      // Reset if already playing
      audio.currentTime = 0;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('Sound playback failed (likely blocked):', e);
          // Try one more time with a fresh object if cached one failed
          const fallback = new Audio(path);
          fallback.play().catch(err => console.error('Fallback sound playback failed:', err));
        });
      }
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }
}

export const soundService = new SoundService();
