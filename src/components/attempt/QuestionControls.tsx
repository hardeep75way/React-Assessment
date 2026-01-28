import { Box, Button } from '@mui/material';

interface QuestionControlsProps {
    currentIndex: number;
    totalQuestions: number;
    onPrevious: () => void;
    onNext: () => void;
    onFinish: () => void;
}

export function QuestionControls({
    currentIndex,
    totalQuestions,
    onPrevious,
    onNext,
    onFinish
}: QuestionControlsProps) {
    const isFirstQuestion = currentIndex === 0;
    const isLastQuestion = currentIndex === totalQuestions - 1;

    return (
        <Box mt={4} display="flex" justifyContent="space-between">
            <Button
                variant="outlined"
                onClick={onPrevious}
                disabled={isFirstQuestion}
            >
                Previous
            </Button>

            {isLastQuestion ? (
                <Button
                    variant="contained"
                    color="success"
                    onClick={onFinish}
                >
                    Finish
                </Button>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onNext}
                >
                    Next
                </Button>
            )}
        </Box>
    );
}
