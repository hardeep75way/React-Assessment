import { useState, useCallback, useEffect } from 'react';

interface UseWebcamReturn {
    stream: MediaStream | null;
    error: string | null;
    isLoading: boolean;
    hasPermission: boolean | null;
    requestPermission: () => Promise<boolean>;
    stopStream: () => void;
}

export function useWebcam(): UseWebcamReturn {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const requestPermission = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 },
                audio: false
            });
            setStream(mediaStream);
            setHasPermission(true);
            return true;
        } catch (err) {
            console.error("Webcam permission denied:", err);
            setError((err as Error).message || "Could not access webcam. Please check your permissions.");
            setHasPermission(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopStream();
        };
    }, [stopStream]);

    return {
        stream,
        error,
        isLoading,
        hasPermission,
        requestPermission,
        stopStream
    };
}
