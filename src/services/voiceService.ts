import { getJosa } from "../utils";
import i18n from "../i18n";

/**
 * Service for handling Text-to-Speech (TTS) notifications.
 */
class VoiceService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private lastTriggeredId: string | null = null;
  private isUnlocked: boolean = false;
  private isUnlocking: boolean = false;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (!this.synth) return;
    
    const loadVoices = () => {
      this.synth!.getVoices();
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Unlocks the speech synthesis session.
   * MUST be called from a user interaction (click/tap) event for iOS compatibility.
   */
  unlock() {
    if (!this.synth || this.isUnlocked || this.isUnlocking) return;
    
    this.isUnlocking = true;
    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      utterance.onend = () => {
        this.isUnlocked = true;
        this.isUnlocking = false;
        console.log("Voice audio session unlocked for iOS");
      };
      utterance.onerror = () => {
        this.isUnlocking = false;
      };
      this.synth.speak(utterance);
    } catch (e) {
      this.isUnlocking = false;
      console.error("Failed to unlock voice session", e);
    }
  }

  /**
   * Speaks a message using the browser's SpeechSynthesis API.
   * If another voice is playing, it will be cancelled.
   */
  speak(message: string) {
    if (!this.synth || !message) return;

    // Rule 5: Collision handling - cancel previous
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    const currentLang = i18n.language || 'ko';
    const langCode = currentLang.startsWith('ja') ? 'ja-JP' : currentLang.startsWith('en') ? 'en-US' : 'ko-KR';
    utterance.lang = langCode;
    utterance.rate = 1.0;
    
    const voices = this.synth.getVoices();
    const matchingVoice = voices.find(v => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2))) ||
                          voices.find(v => v.lang.startsWith('ko')) ||
                          voices[0];
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    // Media Session Support: Signals to the OS that audio is playing.
    // This helps with "ducking" background music on some mobile browsers.
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: i18n.t('voice.mediaTitle'),
          artist: i18n.t('voice.mediaArtist'),
          album: i18n.t('voice.mediaAlbum')
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch (e) {
        console.warn("MediaSession update failed", e);
      }
    }

    utterance.onend = () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    };

    utterance.onerror = () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    };

    this.isUnlocked = true;
    this.synth.speak(utterance);
  }

  /**
   * Replaces variables in a template string and speaks if trigger Id is unique.
   */
  speakNagging(
    triggerId: string,
    template: string,
    variables: { name?: string; task?: string; n?: number; m?: number; r?: number }
  ) {
    if (this.lastTriggeredId === triggerId) return;
    this.lastTriggeredId = triggerId;

    let msg = template;
    const { name = '', task = '', n = 0, m = 0, r = 0 } = variables;

    // 1. Apply particle rules (Josa) if variables were used followed by dual particles
    // e.g. "task이/가" -> "루틴이" or "커피가"
    // Single particles like "task가" will be output as is (e.g. "루틴가") as requested.
    const josaRegex = /(name|task)(이\/가|을\/를|은\/는|으로\/로|이죠\/죠|이야\/야|이다\/다)/g;
    msg = msg.replace(josaRegex, (_, variable, p1) => {
      const val = variable === 'name' ? name : task;
      return val + getJosa(val, p1 as any);
    });

    // 2. Replace remaining solo variables
    const placeholderRegex = /(?<![a-zA-Z])(name|task|n|m|r)(?![a-zA-Z])/g;
    msg = msg.replace(placeholderRegex, (match) => {
      if (match === 'name') return name;
      if (match === 'task') return task;
      if (match === 'n') return n.toString();
      if (match === 'm') return m.toString();
      if (match === 'r') return r.toString();
      return match;
    });

    this.speak(msg);
  }

  /**
   * Immediately stops any ongoing speech.
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    }
  }
}

export const voiceService = new VoiceService();
