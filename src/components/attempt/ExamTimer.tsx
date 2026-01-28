import { AccessTime } from '@mui/icons-material';
import { Box, Typography, LinearProgress } from '@mui/material';

interface ExamTimerProps {
    formattedTime: string;
    isTimeLow?: boolean; // e.g. < 5 mins
    progress: number;
}



export function ExamTimer({ formattedTime, isTimeLow, progress }: ExamTimerProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isTimeLow ? 'error.light' : 'divider',
                bgcolor: isTimeLow ? 'error.50' : 'background.paper',
                color: isTimeLow ? 'error.main' : 'text.primary',
                boxShadow: 1
            }}
        >
            <AccessTime
                sx={{
                    fontSize: 20,
                    animation: isTimeLow ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 }
                    }
                }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 80 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        lineHeight: 1
                    }}
                >
                    {formattedTime}
                </Typography>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        mt: 0.5,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                            bgcolor: isTimeLow ? 'error.main' : 'primary.main',
                            transition: 'transform 1s linear'
                        }
                    }}
                />
            </Box>
        </Box>
    );
}
