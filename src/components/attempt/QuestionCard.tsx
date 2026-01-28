import { Question } from '@/types/quiz';
import { Flag, OutlinedFlag } from '@mui/icons-material';
import {
    Box,
    Typography,
    Button,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Paper,
    Chip
} from '@mui/material';

interface QuestionCardProps {
    question: Question;
    selectedAnswer?: string | string[]; // Single string for MCQ, array for multi-select (future proof)
    onAnswerSelect: (answer: string) => void;
    isMarked: boolean;
    onToggleMark: () => void;
    questionNumber: number;
}

export function QuestionCard({
    question,
    selectedAnswer,
    onAnswerSelect,
    isMarked,
    onToggleMark,
    questionNumber
}: QuestionCardProps) {

    // For now support MCQ via Radio. If Multi-select needed later, we check question type.
    const currentValue = typeof selectedAnswer === 'string' ? selectedAnswer : '';

    return (
        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                    <Chip
                        label={`Question ${questionNumber}`}
                        size="small"
                        sx={{ mb: 1.5, borderRadius: 1 }}
                        color="default"
                        variant="outlined"
                    />
                    <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1.6 }}>
                        {question.question_text}
                    </Typography>
                </Box>
                <Button
                    variant={isMarked ? "contained" : "outlined"}
                    color="warning"
                    size="small"
                    startIcon={isMarked ? <Flag sx={{ fontSize: 16 }} /> : <OutlinedFlag sx={{ fontSize: 16 }} />}
                    onClick={onToggleMark}
                    sx={{ borderRadius: 10, textTransform: 'none' }}
                >
                    {isMarked ? 'Marked' : 'Mark for Review'}
                </Button>
            </Box>

            <FormControl component="fieldset" fullWidth>
                <RadioGroup
                    aria-label="question-options"
                    name={`question-${question.id}`}
                    value={currentValue}
                    onChange={(e) => onAnswerSelect(e.target.value)}
                >
                    <Box display="flex" flexDirection="column" gap={2}>
                        {question.options.map((option, idx) => {
                            const isSelected = currentValue === option;
                            return (
                                <Paper
                                    key={idx}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        borderColor: isSelected ? 'primary.main' : 'divider', // Changed to primary.main for MUI theme
                                        bgcolor: isSelected ? 'primary.light' : 'transparent', // Changed to primary.light for MUI theme
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: isSelected ? 'primary.main' : 'primary.light', // Changed to primary.main/light
                                            bgcolor: isSelected ? 'primary.light' : 'grey.50'
                                        }
                                    }}
                                >
                                    <FormControlLabel
                                        value={option}
                                        control={<Radio size="small" />}
                                        label={<Typography variant="body2">{option}</Typography>}
                                        sx={{ width: '100%', m: 0 }}
                                    />
                                </Paper>
                            );
                        })}
                    </Box>
                </RadioGroup>
            </FormControl>

            <Box mt={4} display="flex" justifyContent="flex-end">
                <Typography variant="caption" color="text.secondary">
                    Points: {question.points}
                </Typography>
            </Box>
        </Paper>
    );
}
