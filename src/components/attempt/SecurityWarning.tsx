import { Backdrop, Box, Button, Typography, Paper } from '@mui/material';
import { Warning, Fullscreen } from '@mui/icons-material';

interface SecurityWarningProps {
    isOpen: boolean;
    onReEnter: () => void;
    violationCount: number;
}

const styles = {
    paper: {
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        maxWidth: 480,
        textAlign: 'center',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'error.main',
        bgcolor: 'background.paper'
    },
    warningIcon: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        bgcolor: 'error.light',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'error.main'
    },
    warningText: {
        variant: "h5",
        fontWeight: "bold",
        gutterBottom: true,
        color: "error.main"
    },
    violationCountText: {
        variant: "body2",
        sx: {
            mt: 1,
            color: "text.secondary"
        }
    },
}

export function SecurityWarning({ isOpen, onReEnter, violationCount }: SecurityWarningProps) {
    if (!isOpen) return null;

    return (
        <Backdrop
            sx={{
                color: '#fff',
                zIndex: (theme) => theme.zIndex.drawer + 999,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(0, 0, 0, 0.9)'
            }}
            open={isOpen}
        >
            <Paper
                elevation={6}
                sx={styles.paper}
            >
                <Box
                    sx={styles.warningIcon}
                >
                    <Warning sx={{ fontSize: 32 }} />
                </Box>

                <Box>
                    <Typography style={styles.warningText}>
                        Exam Security Warning
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        You have exited fullscreen mode. This is a violation of exam rules.
                        Please return to fullscreen immediately to continue.
                    </Typography>
                    {violationCount > 0 && (
                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            Violation Count: <strong>{violationCount}</strong>
                        </Typography>
                    )}
                </Box>

                <Button
                    variant="contained"
                    color="error"
                    size="large"
                    startIcon={<Fullscreen />}
                    fullWidth
                    sx={{ py: 1.5 }}
                    onClick={onReEnter}
                >
                    Return to Fullscreen
                </Button>
            </Paper>
        </Backdrop>
    );
}
