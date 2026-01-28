import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { ExamTimer } from './ExamTimer';

interface ExamHeaderProps {
    quizTitle?: string;
    formattedTime: string;
    progress: number;
    isTimeLow: boolean;
    onSubmit: () => void;
}

export function ExamHeader({
    quizTitle,
    formattedTime,
    progress,
    isTimeLow,
    onSubmit
}: ExamHeaderProps) {
    return (
        <Paper elevation={1} square sx={{ position: 'sticky', top: 0, zIndex: 1100 }}>
            <Container maxWidth="xl">
                <Box height={64} display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" noWrap sx={{ maxWidth: '50%' }}>
                        {quizTitle}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                        <ExamTimer
                            formattedTime={formattedTime}
                            progress={progress}
                            isTimeLow={isTimeLow}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onSubmit}
                        >
                            Submit Exam
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Paper>
    );
}
