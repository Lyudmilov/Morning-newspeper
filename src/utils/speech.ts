// Bulgarian Speech Synthesis & Audio Helper (Female voice only, no male voices)

export class BulgarianTTS {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static audioElement: HTMLAudioElement | null = null;
  private static currentPlaybackRate = 1.0;

  // Find strictly female voice - NEVER allow an ugly male voice
  public static getPreferredVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    const isMaleName = (name: string) =>
      /ivan|george|stefan|david|mark|boris|guy|\bmale\b|desktop|kalin|petar|dimitar|aleksandar/i.test(name);
    const isFemaleName = (name: string) =>
      /daria|female|samantha|zira|victoria|maria|irina|anna|elena|gergana|milena|google|neural|natural/i.test(name);

    // 1. Look for Bulgarian female voice (e.g., Microsoft Daria, Google български, Apple Milena)
    const bgVoices = voices.filter(
      (v) => (v.lang.startsWith('bg') || v.name.toLowerCase().includes('bulgarian')) && !isMaleName(v.name)
    );

    const bgFemale = bgVoices.find((v) => isFemaleName(v.name));
    if (bgFemale) return bgFemale;
    if (bgVoices.length > 0) return bgVoices[0]; // Bulgarian voice that is confirmed not male

    // 2. Fallback to gentle multilingual female voice
    const femaleVoice = voices.find((v) => isFemaleName(v.name) && !isMaleName(v.name));
    if (femaleVoice) return femaleVoice;

    return null;
  }

  private static activeChunks: string[] = [];
  private static currentChunkIndex = 0;
  private static isSpeakingChunks = false;

  // Speak verbatim text (supporting long-form unrestricted text by chunking sentences)
  public static speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      onBoundary?: (charIndex: number) => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): boolean {
    if (!this.synth) return false;

    this.stop();

    if (!text || text.trim().length === 0) return false;

    try {
      // Split into digestible chunks (by sentences or ~200 chars) so browser SpeechSynthesis never times out on long articles
      const sentenceRegex = /[^.!?]+[.!?]+|\s*[^.!?]+$/g;
      const rawSentences = text.match(sentenceRegex) || [text];
      const chunks: string[] = [];
      let cur = '';

      for (const s of rawSentences) {
        if ((cur + ' ' + s).trim().length > 250) {
          if (cur.trim()) chunks.push(cur.trim());
          cur = s;
        } else {
          cur = cur ? cur + ' ' + s : s;
        }
      }
      if (cur.trim()) chunks.push(cur.trim());

      this.activeChunks = chunks.length > 0 ? chunks : [text];
      this.currentChunkIndex = 0;
      this.isSpeakingChunks = true;

      const rate = options.rate || this.currentPlaybackRate || 1.0;
      const pitch = options.pitch ?? 1.2;
      const preferredVoice = this.getPreferredVoice();

      const speakNextChunk = () => {
        if (!this.isSpeakingChunks || this.currentChunkIndex >= this.activeChunks.length) {
          this.isSpeakingChunks = false;
          this.currentUtterance = null;
          if (options.onEnd) options.onEnd();
          return;
        }

        const chunkText = this.activeChunks[this.currentChunkIndex];
        this.currentChunkIndex++;

        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.lang = 'bg-BG';
        utterance.rate = rate;
        utterance.pitch = pitch;
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
          speakNextChunk();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis chunk error:', e);
          if (this.currentChunkIndex < this.activeChunks.length) {
            speakNextChunk();
          } else {
            this.isSpeakingChunks = false;
            this.currentUtterance = null;
            if (options.onError) options.onError(e);
          }
        };

        this.currentUtterance = utterance;
        this.synth?.speak(utterance);
      };

      speakNextChunk();
      return true;
    } catch (err) {
      console.error('SpeechSynthesis exception:', err);
      return false;
    }
  }

  // Play base64 audio returned from Gemini TTS with specified playback rate
  public static playAudioBase64(
    base64: string,
    mimeType = 'audio/mp3',
    onEnd?: () => void,
    rate = 1.0
  ): HTMLAudioElement {
    this.stop();
    this.currentPlaybackRate = rate;
    const audio = new Audio(`data:${mimeType};base64,${base64}`);
    audio.playbackRate = rate;
    this.audioElement = audio;
    if (onEnd) {
      audio.onended = onEnd;
    }
    audio.play().catch((e) => console.warn('Audio play failed:', e));
    return audio;
  }

  // Dynamically update playback rate during playback for immediate response
  public static setPlaybackRate(rate: number): void {
    this.currentPlaybackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  public static pause(): void {
    if (this.synth?.speaking) {
      this.synth.pause();
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public static resume(): void {
    if (this.synth?.paused) {
      this.synth.resume();
    }
    if (this.audioElement?.paused) {
      this.audioElement.play().catch(console.warn);
    }
  }

  public static stop(): void {
    this.isSpeakingChunks = false;
    this.activeChunks = [];
    this.currentChunkIndex = 0;
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
  }

  public static isSpeaking(): boolean {
    return !!(this.synth?.speaking || (this.audioElement && !this.audioElement.paused));
  }

  // Pre-warm synthesizer engine on load for instant playback
  public static warmup(): void {
    if (typeof window !== 'undefined' && this.synth) {
      this.synth.getVoices();
    }
  }
}

// Chime sound generator for 7:00 AM dispatch
export function playMorningChime(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Elegant morning bell chime: C5 -> E5 -> G5 -> C6
    playTone(523.25, now, 1.2);
    playTone(659.25, now + 0.25, 1.2);
    playTone(783.99, now + 0.5, 1.4);
    playTone(1046.5, now + 0.75, 2.0);
  } catch (e) {
    // AudioContext not allowed before user gesture
  }
}
