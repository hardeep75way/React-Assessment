import { Dialog, DialogContent, DialogTitle, DialogActions, Button, Typography, Box, CircularProgress } from '@mui/material';
import { Videocam } from '@mui/icons-material';
import { WebcamPreview } from './WebcamPreview';

interface WebcamPermissionModalProps {
    isOpen: boolean;
    onStartExam: () => void;
    onRequestPermission: () => Promise<boolean>;
    stream: MediaStream | null;
    hasPermission: boolean | null;
    isLoading: boolean;
    error: string | null;
}

export default function WebcamPermissionModal({
    isOpen,
    onStartExam,
    onRequestPermission,
    stream,
    hasPermission,
    isLoading,
    error
}: WebcamPermissionModalProps) {

    return (
        <Dialog
            open={isOpen}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
            // Prevent closing by clicking outside
            onClose={(_, reason) => {
                if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                    // allow close if needed logic
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                <Box display="flex" justifyContent="center" mb={2}>
                    <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main' }}>
                        <Videocam sx={{ fontSize: 24 }} />
                    </Box>
                </Box>
                Webcam Access Required
            </DialogTitle>

            <DialogContent>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    To ensure the integrity of the exam, we require access to your webcam.
                    Please allow camera access to proceed.
                </Typography>

                <Box display="flex" justifyContent="center" mb={2}>
                    <WebcamPreview
                        stream={stream}
                        isPermissionsGranted={hasPermission}
                        className="w-64 h-48 border-2 border-gray-200"
                    />
                </Box>

                {error && (
                    <Typography color="error" variant="caption" display="block" align="center" sx={{ mt: 1 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 4, justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                {hasPermission ? (
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={onStartExam}
                    >
                        Start Exam
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => onRequestPermission()}
                        disabled={isLoading}
                        startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
                    >
                        {isLoading ? 'Requesting...' : 'Allow Camera'}
                    </Button>
                )}

                <Button
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    onClick={() => window.history.back()}
                    sx={{ mt: 1, ml: '0 !important' }} // Override specific DialogActions spacing if needed
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
