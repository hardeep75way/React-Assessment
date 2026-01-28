import { Dialog, CircularProgress, Typography } from '@mui/material';

interface SubmittingOverlayProps {
    open: boolean;
}

export function SubmittingOverlay({ open }: SubmittingOverlayProps) {
    return (
        <Dialog
            open={open}
            PaperProps={{ sx: { px: 4, py: 2, alignItems: 'center' } }}
        >
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">Submitting Exam...</Typography>
            <Typography variant="body2" color="text.secondary">
                Please wait while we wrap things up.
            </Typography>
        </Dialog>
    );
}
