import { useRef, useEffect } from 'react';
import { Videocam, VideocamOff } from '@mui/icons-material';

interface WebcamPreviewProps {
    stream: MediaStream | null;
    className?: string;
    isPermissionsGranted?: boolean | null;
}

export function WebcamPreview({ stream, className = "", isPermissionsGranted }: WebcamPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={`relative overflow-hidden bg-gray-900 rounded-lg shadow-inner flex items-center justify-center ${className}`}>
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 p-4">
                    {isPermissionsGranted === false ? (
                        <VideocamOff sx={{ fontSize: 48, mb: 1, color: 'error.main' }} />
                    ) : (
                        <Videocam sx={{ fontSize: 48, mb: 1 }} />
                    )}
                    <p className="text-xs text-center">
                        {isPermissionsGranted === false ? "Camera access denied" : "Waiting for camera..."}
                    </p>
                </div>
            )}

            {stream && (
                <div className="absolute top-2 right-2">
                    <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </div>
            )}
        </div>
    );
}
