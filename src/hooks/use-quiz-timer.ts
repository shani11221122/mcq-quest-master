import { useState, useEffect, useCallback, useRef } from "react";

interface UseQuizTimerProps {
  totalSeconds: number;
  initialSeconds?: number;
  onTimeUp: () => void;
  onTick?: (secondsLeft: number) => void;
  enabled: boolean;
}

export function useQuizTimer({ totalSeconds, initialSeconds, onTimeUp, onTick, enabled }: UseQuizTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds ?? totalSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  const onTickRef = useRef(onTick);
  onTimeUpRef.current = onTimeUp;
  onTickRef.current = onTick;
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const start = initialSeconds ?? totalSeconds;
    if (start <= 0) return;
    if (!initializedRef.current) {
      setSecondsLeft(start);
      initializedRef.current = true;
    }
  }, [totalSeconds, initialSeconds, enabled]);

  useEffect(() => {
    if (!enabled || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          setTimeout(() => onTimeUpRef.current(), 0);
          return 0;
        }
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, secondsLeft <= 0]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const percentage = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const isLow = secondsLeft <= 60 && secondsLeft > 0;
  const isCritical = secondsLeft <= 30 && secondsLeft > 0;

  return { secondsLeft, formatted, percentage, isLow, isCritical };
}
