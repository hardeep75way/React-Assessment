import { useState, useEffect, useCallback, useRef } from 'react';

interface UseExamTimerProps {
    durationSeconds?: number;
    expiresAt?: string; // ISO string
    onTimeUp?: () => void;
}

interface UseExamTimerReturn {
    timeLeft: number;
    formattedTime: string;
    isTimeUp: boolean;
    progress: number; // Percentage 0-100
}

export function useExamTimer({ durationSeconds, expiresAt, onTimeUp }: UseExamTimerProps): UseExamTimerReturn {
    const calculateTimeLeft = useCallback(() => {
        if (expiresAt) {
            const now = new Date().getTime();
            const end = new Date(expiresAt).getTime();
            const diff = Math.max(0, Math.floor((end - now) / 1000));
            return diff;
        } else if (durationSeconds !== undefined) {
            return durationSeconds;
        }
        return 0;
    }, [expiresAt, durationSeconds]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [totalDuration] = useState(durationSeconds || timeLeft);

    const onTimeUpRef = useRef(onTimeUp);

    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

    // Sync timeLeft when props change
    useEffect(() => {
        setTimeLeft(calculateTimeLeft());
    }, [calculateTimeLeft, expiresAt, durationSeconds]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (expiresAt) {
                    const left = calculateTimeLeft();
                    if (left <= 0) {
                        clearInterval(interval);
                        if (prev > 0) onTimeUpRef.current?.();
                        return 0;
                    }
                    return left;
                } else {
                    if (prev <= 0) {
                        clearInterval(interval);
                        // Only trigger if it was ticking
                        return 0;
                    }
                    const next = prev - 1;
                    if (next === 0) {
                        onTimeUpRef.current?.();
                    }
                    return next;
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, durationSeconds, calculateTimeLeft]);


    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

    return {
        timeLeft,
        formattedTime: formatTime(timeLeft),
        isTimeUp: timeLeft === 0,
        progress
    };
}
