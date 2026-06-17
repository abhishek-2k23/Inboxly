"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast";

export type VoiceState = "idle" | "listening" | "error";

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
}

interface UseVoiceInputReturn {
  voiceState: VoiceState;
  isSupported: boolean;
  toggle: () => void;
}

export function useVoiceInput({
  onTranscript,
  onInterim,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const toast = useToast();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interimRef = useRef<string>("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    interimRef.current = "";
    setVoiceState("idle");
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new SR();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceState("listening");
      interimRef.current = "";
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results.item(i);
        const alt = result?.item(0);
        if (!result || !alt) continue;
        if (result.isFinal) {
          final += alt.transcript;
        } else {
          interim += alt.transcript;
        }
      }

      if (interim) {
        interimRef.current = interim;
        onInterim?.(interim);
      }

      if (final) {
        interimRef.current = "";
        onTranscript(final.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Allow microphone permission and try again.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error("Voice input failed. Please try again.");
      }
      setVoiceState("idle");
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setVoiceState("idle");
      recognitionRef.current = null;
      interimRef.current = "";
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, onTranscript, onInterim, toast]);

  const toggle = useCallback(() => {
    if (voiceState === "listening") {
      stop();
    } else {
      start();
    }
  }, [voiceState, start, stop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { voiceState, isSupported, toggle };
}
