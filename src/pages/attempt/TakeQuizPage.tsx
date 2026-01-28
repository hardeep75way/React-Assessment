import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptsApi } from '@/api/attempts';
import { quizzesApi } from '@/api/quizzes';
import { useWebcam } from '@/hooks/useWebcam';
import { useExamTimer } from '@/hooks/useExamTimer';
import { WebcamPreview } from '@/components/attempt/WebcamPreview';
import WebcamPermissionModal from '@/components/attempt/WebcamPermissionModal';
import { ExamTimer } from '@/components/attempt/ExamTimer';
import { QuestionNavigation } from '@/components/attempt/QuestionNavigation';
import { QuestionCard } from '@/components/attempt/QuestionCard';
import { Question, Quiz } from '@/types/quiz';
import { Attempt } from '@/types/attempt';
import CancelIcon from '@mui/icons-material/Cancel';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Box,
    Typography,
    Container,
    Paper,
    CircularProgress
} from '@mui/material';

export default function TakeQuiz() {
    const { id: quizId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Core State
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Exam State
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, string>>(new Map());
    const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());

    // Helpers
    const webcam = useWebcam();
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Fetch Quiz Data
    useEffect(() => {
        if (!quizId) return;

        const fetchQuiz = async () => {
            try {
                // Fetch quiz details
                // Ideally this includes questions. If not, we might need a separate call.
                // Assuming getById returns questions for now as per plan
                const quizData = await quizzesApi.getById(quizId);
                setQuiz(quizData);
                if (quizData.questions) {
                    setQuestions(quizData.questions);
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to load quiz", err);
                setError("Failed to load quiz metadata.");
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId]);

    // Timer Logic
    // Real fix for Timer callback closure:
    // We used a Ref in useExamTimer for the callback, so it's always fresh.
    // So we can define the callback here with dependencies!
    const triggerAutoSubmit = useCallback(() => {
        if (attempt && !submitting) {
            handleSubmitAttempt(true);
        }
    }, [attempt, submitting]); // This is safe because useExamTimer uses a ref for the callback

    // Setup timer only when attempt starts.
    const timer = useExamTimer({
        expiresAt: attempt?.expires_at,
        onTimeUp: triggerAutoSubmit
    });


    const handleStartExam = async () => {
        if (!quizId) return;
        setSubmitting(true);
        try {
            const newAttempt = await attemptsApi.start(quizId);
            setAttempt(newAttempt);
            setStarted(true);
            setSubmitting(false);
        } catch (err) {
            console.error("Failed to start exam", err);
            setError("Failed to start exam session. Please try again.");
            setSubmitting(false);
        }
    };

    const handleAnswerSelect = useCallback(async (questionId: string, answer: string) => {
        // Optimistic update
        setAnswers(prev => {
            const next = new Map(prev);
            next.set(questionId, answer);
            return next;
        });

        // Sync with backend (silent)
        if (attempt) {
            try {
                await attemptsApi.submitAnswer(attempt.id, { question_id: questionId, selected_answer: answer });
            } catch (err) {
                console.error("Failed to save answer", err);
                // Retry logic could go here
            }
        }
    }, [attempt]);

    const handleSubmitAttempt = async (auto = false) => {
        if (!attempt) return;
        setSubmitting(true);
        try {
            await attemptsApi.submitAttempt(attempt.id);
            navigate(`/result/${attempt.id}`);
        } catch (err) {
            console.error("Failed to submit attempt", err);
            setError("Failed to submit exam. Please try again.");
            setSubmitting(false);
            setShowSubmitModal(false);
        }
    };

    // Derived state
    const currentQuestion = questions[currentQuestionIndex];
    const isNavigationAnswered = (idx: number) => {
        if (!questions[idx]) return false;
        return answers.has(questions[idx].id);
    };

    // Render Loading/Error
    if (loading) return (
        <Box display="flex" height="100vh" alignItems="center" justifyContent="center">
            <CircularProgress />
        </Box>
    );
    if (error) return (
        <Box display="flex" height="100vh" alignItems="center" justifyContent="center" flexDirection="column" gap={2}>
            <CancelIcon style={{ width: 64, height: 64 }} className="text-red-500" />
            <Typography variant="h5" color="text.primary">{error}</Typography>
            <Button onClick={() => window.location.reload()}>Retry</Button>
        </Box>
    );

    // Start Screen (Permission Modal)
    if (!started) {
        return (
            <WebcamPermissionModal
                isOpen={true}
                onStartExam={handleStartExam}
                onRequestPermission={webcam.requestPermission}
                stream={webcam.stream}
                hasPermission={webcam.hasPermission}
                isLoading={webcam.isLoading}
                error={webcam.error}
            />
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Paper elevation={1} square sx={{ position: 'sticky', top: 0, zIndex: 1100 }}>
                <Container maxWidth="xl">
                    <Box height={64} display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6" noWrap sx={{ maxWidth: '50%' }}>
                            {quiz?.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                            <ExamTimer
                                formattedTime={timer.formattedTime}
                                progress={timer.progress}
                                isTimeLow={timer.timeLeft < 300} // 5 mins
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setShowSubmitModal(true)}
                            >
                                Submit Exam
                            </Button>
                        </Box>
                    </Box>
                </Container>
            </Paper>

            <Container maxWidth="xl" sx={{ flex: 1, py: 4, display: 'flex', gap: 3 }}>
                {/* Left Sidebar: Navigation & Webcam */}
                <Box width={300} display={{ xs: 'none', lg: 'block' }} flexShrink={0}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 90 }}>
                        <WebcamPreview stream={webcam.stream} className="h-48 w-full border-2 border-white shadow-md bg-black rounded" />

                        <QuestionNavigation
                            totalQuestions={questions.length}
                            currentIndex={currentQuestionIndex}
                            answers={answers}
                            markedQuestions={markedQuestions}
                            questionIds={questions.map(q => q.id)}
                            osNavigate={setCurrentQuestionIndex}
                        />
                    </Box>
                </Box>

                {/* Main Content: Question */}
                <Box flex={1}>
                    {currentQuestion && (
                        <QuestionCard
                            question={currentQuestion}
                            questionNumber={currentQuestionIndex + 1}
                            selectedAnswer={answers.get(currentQuestion.id)}
                            onAnswerSelect={(ans) => handleAnswerSelect(currentQuestion.id, ans)}
                            isMarked={markedQuestions.has(currentQuestion.id)}
                            onToggleMark={() => {
                                const next = new Set(markedQuestions);
                                if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
                                else next.add(currentQuestion.id);
                                setMarkedQuestions(next);
                            }}
                        />
                    )}

                    {/* Controls */}
                    <Box mt={4} display="flex" justifyContent="space-between">
                        <Button
                            variant="outlined"
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                        >
                            Previous
                        </Button>

                        {currentQuestionIndex < questions.length - 1 ? (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => setShowSubmitModal(true)}
                            >
                                Finish
                            </Button>
                        )}
                    </Box>
                </Box>
            </Container>

            {/* Confirm Submit Dialog */}
            <Dialog
                open={showSubmitModal}
                onClose={() => !submitting && setShowSubmitModal(false)}
            >
                <DialogTitle>Submit Exam?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You have answered {answers.size} of {questions.length} questions.
                        {markedQuestions.size > 0 && ` You still have ${markedQuestions.size} marked for review.`}
                        <br />Are you sure you want to finish?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSubmitModal(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleSubmitAttempt(false)}
                        variant="contained"
                        color="primary"
                        disabled={submitting}
                        startIcon={submitting && <CircularProgress size={20} color="inherit" />}
                    >
                        Confirm Submit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Auto-Submit / Global Loading Overlay */}
            {submitting && !showSubmitModal && (
                <Dialog open={true} PaperProps={{ sx: { px: 4, py: 2, alignItems: 'center' } }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="h6">Submitting Exam...</Typography>
                    <Typography variant="body2" color="text.secondary">Please wait while we wrap things up.</Typography>
                </Dialog>
            )}
        </Box>
    );
}
