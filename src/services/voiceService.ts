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
    
    // RULE 5.1: Speak an empty string to initialize the audio session on iOS
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
   * @param message The text to speak.
   */
  speak(message: string) {
    if (!this.synth) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    
    // Rule 5.1: Ensure voice is set if available
    if (!this.voice) {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.voice = voices.find(v => v.lang === 'ko-KR' || v.lang.startsWith('ko')) || voices[0];
      }
    }
    
    if (this.voice) {
      utterance.voice = this.voice;
    }

    // Force unlock flag if we are speaking
    this.isUnlocked = true;

    this.synth.speak(utterance);
  }

  /**
   * Processes voice rules and triggers speech if conditions are met.
   * @param rules List of rules from phrases.json
   * @param title The current task title
   * @param elapsedSeconds Current elapsed time in seconds
   * @param targetDurationMinutes Target duration in minutes
   * @param isVoiceEnabled Whether voice is toggled on
   */
  processRules(
    rules: any[],
    title: string,
    elapsedSeconds: number,
    targetDurationMinutes: number,
    isVoiceEnabled: boolean
  ) {
    if (!isVoiceEnabled) return;

    const targetSeconds = (targetDurationMinutes || 0) * 60;
    const remainingSeconds = targetSeconds - elapsedSeconds;

    for (const rule of rules) {
      let shouldTrigger = false;

      if (rule.type === 'remaining') {
        // Trigger if remaining time is exactly the threshold (allowing 1s window)
        if (remainingSeconds === rule.triggerSeconds) {
          shouldTrigger = true;
        }
        // Min target duration constraint
        if (rule.minTargetMinutes && targetDurationMinutes < rule.minTargetMinutes) {
          shouldTrigger = false;
        }
      } else if (rule.type === 'elapsed') {
        const overtimeSeconds = elapsedSeconds - targetSeconds;
        if (overtimeSeconds === rule.triggerSeconds) {
          shouldTrigger = true;
        }
        // Max target duration constraint
        if (rule.maxTargetMinutes && targetDurationMinutes > rule.maxTargetMinutes) {
          shouldTrigger = false;
        }
      }

      if (shouldTrigger) {
        // Prevent repeated triggers for the same rule/task combination in the same second
        const triggerId = `${rule.id}-${title}-${elapsedSeconds}`;
        if (this.lastTriggeredId !== triggerId) {
          this.lastTriggeredId = triggerId;
          
          let msg = rule.message;
          // Apply title and particle rules
          const josaRegex = /\{\{title\}\}(이\/가|을\/를|은\/는|으로\/로|이죠\/죠|이|가|을|를|은|는|으로|로|이죠|죠)/g;
          const particleTagRegex = /\{\{title\}\}\{\{particle:(이\/가|을\/를|은\/는|으로\/로|이죠\/죠|이|가|을|를|은|는|으로|로|이죠|죠)\}\}/g;
          
          msg = msg.replace(josaRegex, (_: string, p1: string) => {
            return title + getJosa(title, p1 as any);
          });
          msg = msg.replace(particleTagRegex, (_: string, p1: string) => {
            return title + getJosa(title, p1 as any);
          });
          msg = msg.replace(/\{\{title\}\}/g, title);

          this.speak(msg);
        }
      }
    }
  }
}

export const voiceService = new VoiceService();
