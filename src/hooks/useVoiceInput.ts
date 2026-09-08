import { useCallback, useRef, useState } from 'react';

// Voice input relies on the browser's SpeechRecognition API, which is not
// supported everywhere (notably: inconsistent on iOS Safari, and may be
// blocked entirely inside restrictive embedded webviews). isSupported lets
// the UI hide/disable the mic button gracefully instead of failing silently.

type SpeechRecognitionLike = typeof window extends { SpeechRecognition: infer T }
  ? T
  : any;

export function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const SpeechRecognitionCtor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const isSupported = Boolean(SpeechRecognitionCtor);

  const start = useCallback(() => {
    if (!isSupported) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isSupported, isListening, start, stop };
}
