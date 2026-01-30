import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';

interface UseExamSecurityProps {
    isExamActive: boolean;
}

interface Violation {
    type: 'fullscreen' | 'focus';
    timestamp: number;
    description: string;
}

export function useExamSecurity({ isExamActive }: UseExamSecurityProps) {
    const [isFullscreen, setIsFullscreen] = useState(true);
    const [violations, setViolations] = useState<Violation[]>([]);
    const [violationCount, setViolationCount] = useState(0);
    const { enqueueSnackbar } = useSnackbar();


    const addViolation = useCallback((type: 'fullscreen' | 'focus', description: string) => {
        if (!isExamActive) return;

        const newViolation = {
            type,
            timestamp: Date.now(),
            description
        };

        setViolations(prev => [...prev, newViolation]);
        setViolationCount(prev => {
            const newCount = prev + 1;

            enqueueSnackbar(`Warning: ${description} (Violation ${newCount})`, {
                variant: 'warning',
                autoHideDuration: 5000,
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            });
            return newCount;
        });
    }, [isExamActive, enqueueSnackbar]);

    useEffect(() => {
        if (!isExamActive) return;

        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);

            if (!isFs) {
                addViolation('fullscreen', 'Fullscreen mode exited. Please return to fullscreen immediately.');
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);


        handleFullscreenChange();

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isExamActive, addViolation]);

    useEffect(() => {
        if (!isExamActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                addViolation('focus', 'Exam tab lost focus. Please stay on the exam page.');
            }
        };

        const handleBlur = () => {
            addViolation('focus', 'Window lost focus.');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [isExamActive, addViolation]);

    const enterFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.error('Failed to enter fullscreen:', err);
            enqueueSnackbar('Failed to enter fullscreen. Please try again.', { variant: 'error' });
        }
    }, [enqueueSnackbar]);

    return {
        isFullscreen,
        violations,
        violationCount,
        enterFullscreen
    };
}
