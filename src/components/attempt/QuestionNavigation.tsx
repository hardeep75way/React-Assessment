import { Button, Typography, Box } from '@mui/material';
import { useMemo } from 'react';

interface QuestionNavigationProps {
    totalQuestions: number;
    currentIndex: number;
    answers: Map<string, string | string[]>;
    markedQuestions: Set<string>;
    questionIds: string[];
    onNavigate: (index: number) => void;
}

export function QuestionNavigation({
    totalQuestions,
    currentIndex,
    answers,
    markedQuestions,
    questionIds,
    onNavigate
}: QuestionNavigationProps) {
    const memoizedButtons = useMemo(() => {
        return Array.from({ length: totalQuestions }).map((_, idx) => {
            const questionId = questionIds[idx];
            const isAnswered = answers.has(questionId);
            const isMarked = markedQuestions.has(questionId);
            const isCurrent = currentIndex === idx;

            let color: "primary" | "warning" | "success" | "inherit" = "inherit";
            let variant: "contained" | "outlined" | "text" = "outlined";

            if (isCurrent) {
                color = "primary";
                variant = "contained";
            } else if (isMarked) {
                color = "warning";
                variant = "outlined"; // Or contained if preferred
            } else if (isAnswered) {
                color = "success";
                variant = "outlined";
            }

            return (
                <Button
                    key={idx}
                    variant={variant}
                    color={color}
                    onClick={() => onNavigate(idx)}
                    sx={{
                        minWidth: 32,
                        width: 32,
                        height: 32,
                        p: 0,
                        borderRadius: '50%',
                        position: 'relative'
                    }}
                    aria-label={`Go to question ${idx + 1}`}
                >
                    {idx + 1}
                    {isMarked && !isCurrent && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'warning.main',
                                border: '1px solid white'
                            }}
                        />
                    )}
                </Button>
            );
        });
    }, [totalQuestions, currentIndex, answers, markedQuestions, questionIds, onNavigate]);

    return (
        <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 1, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Questions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {memoizedButtons}
            </Box>

            <Box mt={2} display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main', opacity: 0.1, border: '1px solid', borderColor: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary">Answered</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main', opacity: 0.1, border: '1px solid', borderColor: 'warning.main' }} />
                    <Typography variant="caption" color="text.secondary">Marked for Review</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                    <Typography variant="caption" color="text.secondary">Current</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid', borderColor: 'grey.300' }} />
                    <Typography variant="caption" color="text.secondary">Not Answered</Typography>
                </Box>
            </Box>
        </Box>
    );
}
