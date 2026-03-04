import { useState, useEffect, useCallback, useRef } from "react";

interface UseQuizTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  enabled: boolean;
}

export function useQuizTimer({ totalSeconds, onTimeUp, enabled }: UseQuizTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (!enabled) return;
    setSecondsLeft(totalSeconds);
  }, [totalSeconds, enabled]);

  useEffect(() => {
    if (!enabled || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => onTimeUpRef.current(), 0);
          return 0;
        }
        return prev - 1;
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
