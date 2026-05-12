import { getJosa } from "../utils";

/**
 * Service for handling Text-to-Speech (TTS) notifications.
 */
class VoiceService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private lastTriggeredId: string | null = null;
  private isUnlocked: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (!this.synth) return;
    
    const loadVoices = () => {
      const voices = this.synth!.getVoices();
      if (voices.length > 0) {
        // Try to find a Korean voice, or use default
        this.voice = voices.find(v => v.lang === 'ko-KR') || voices[0];
      }
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
    if (!this.synth || this.isUnlocked) return;
    
    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      this.synth.speak(utterance);
      this.isUnlocked = true;
      console.log("Voice audio session unlocked for iOS");
    } catch (e) {
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
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    
    if (!this.voice) {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.voice = voices.find(v => v.lang === 'ko-KR' || v.lang.startsWith('ko')) || voices[0];
      }
    }
    
    if (this.voice) {
      utterance.voice = this.voice;
    }

    this.isUnlocked = true;
    this.synth.speak(utterance);
  }

  /**
   * Replaces variables in a template string and speaks if trigger Id is unique.
   */
  speakNagging(
    triggerId: string,
    template: string,
    variables: { name?: string; task?: string; n?: number; m?: number }
  ) {
    if (this.lastTriggeredId === triggerId) return;
    this.lastTriggeredId = triggerId;

    let msg = template;
    const { name = '', task = '', n = 0, m = 0 } = variables;

    // Replace variables
    msg = msg.replace(/name/g, name);
    msg = msg.replace(/task/g, task);
    msg = msg.replace(/n/g, n.toString());
    msg = msg.replace(/m/g, m.toString());

    // Apply particle rules (Josa) if variables were used followed by particles
    // e.g. "task가" -> "루틴이"
    const josaRegex = /(name|task)(이\/가|을\/를|은\/는|으로\/로|이죠\/죠|이|가|을|를|은|는|으로|로|이죠|죠)/g;
    msg = msg.replace(josaRegex, (match, variable, p1) => {
      const val = variable === 'name' ? name : task;
      return val + getJosa(val, p1 as any);
    });

    this.speak(msg);
  }

  /**
   * Immediately stops any ongoing speech.
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const voiceService = new VoiceService();
