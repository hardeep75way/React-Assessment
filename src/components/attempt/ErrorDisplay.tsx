import { Box, Typography, Button } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

interface ErrorDisplayProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
    return (
        <Box
            display="flex"
            height="100vh"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap={2}
        >
            <CancelIcon sx={{ width: 64, height: 64, color: 'error.main' }} />
            <Typography variant="h5" color="text.primary">
                {message}
            </Typography>
            {onRetry && (
                <Button variant="contained" onClick={onRetry}>
                    Retry
                </Button>
            )}
        </Box>
    );
}
