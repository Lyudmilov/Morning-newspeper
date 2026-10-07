import { useState, useEffect, useRef, useCallback } from 'react';

export interface VoiceNavigationOptions {
  onNext?: () => void;
  onPrev?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onClose?: () => void;
  enabled?: boolean;
}

export interface VoiceNavigationState {
  isSupported: boolean;
  isListening: boolean;
  lastTranscript: string | null;
  lastCommand: string | null;
  error: string | null;
  toggleListening: () => void;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceNavigation(options: VoiceNavigationOptions): VoiceNavigationState {
  const { onNext, onPrev, onPlay, onPause, onClose, enabled = true } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(false);
  const commandTimeoutRef = useRef<any>(null);

  // Keep callback refs fresh
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onCloseRef.current = onClose;
  }, [onNext, onPrev, onPlay, onPause, onClose]);

  // Command trigger helper with display toast
  const triggerCommand = useCallback((cmdName: string, action: (() => void) | undefined) => {
    setLastCommand(cmdName);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    commandTimeoutRef.current = setTimeout(() => {
      setLastCommand(null);
    }, 2500);

    if (action) {
      action();
    }
  }, []);

  // Process Bulgarian voice transcripts
  const processTranscript = useCallback((text: string) => {
    const clean = text.trim().toLowerCase();
    setLastTranscript(clean);

    // 1. Next article: "следваща", "следващата", "следващ", "напред", "нататък", "следващо"
    if (/(следващ[аоеи]?|напред|нататък|next)/i.test(clean)) {
      triggerCommand('следваща статия', onNextRef.current);
      return;
    }

    // 2. Previous article: "предишна", "предишната", "предишен", "назад", "върни"
    if (/(предишн[аоеи]?|назад|върни|previous)/i.test(clean)) {
      triggerCommand('предишна статия', onPrevRef.current);
      return;
    }

    // 3. Play / Read: "прочети", "чети", "пусни", "слушай", "старт"
    if (/(прочети|чети|пусни|слушай|старт|плей)/i.test(clean)) {
      triggerCommand('прочети статията', onPlayRef.current);
      return;
    }

    // 4. Pause / Stop: "пауза", "спри", "стоп"
    if (/(пауза|спри|стоп|тишина)/i.test(clean)) {
      triggerCommand('пауза', onPauseRef.current);
      return;
    }

    // 5. Close: "затвори", "изход"
    if (/(затвори|изход|приключи)/i.test(clean)) {
      triggerCommand('затвори', onCloseRef.current);
      return;
    }
  }, [triggerCommand]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'bg-BG';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        if (transcript) {
          processTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal timeout waiting for speech, do not treat as fatal error
          return;
        }
        if (event.error === 'not-allowed') {
          setError('Достъпът до микрофон е отказан.');
          setIsListening(false);
          shouldBeListeningRef.current = false;
          return;
        }
        console.warn('SpeechRecognition warning:', event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart if user wanted listening to remain active
        if (shouldBeListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or restarting
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
      setIsSupported(false);
    }

    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    };
  }, [processTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldBeListeningRef.current = true;
    try {
      recognitionRef.current.start();
    } catch (e) {
      // might already be started
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {}
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Turn on/off based on external `enabled` prop
  useEffect(() => {
    if (enabled && isSupported) {
      startListening();
    } else {
      stopListening();
    }
  }, [enabled, isSupported, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    lastTranscript,
    lastCommand,
    error,
    toggleListening,
    startListening,
    stopListening,
  };
}
