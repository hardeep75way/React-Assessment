import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { attemptsApi } from '@/api/attempts';
import { quizzesApi } from '@/api/quizzes';
import { useWebcam } from '@/hooks/useWebcam';
import { useExamTimer } from '@/hooks/useExamTimer';
import WebcamPermissionModal from '@/components/attempt/WebcamPermissionModal';
import { QuestionCard } from '@/components/attempt/QuestionCard';
import { LoadingState } from '@/components/attempt/LoadingState';
import { ErrorDisplay } from '@/components/attempt/ErrorDisplay';
import { ExamHeader } from '@/components/attempt/ExamHeader';
import { QuizSidebar } from '@/components/attempt/QuizSidebar';
import { QuestionControls } from '@/components/attempt/QuestionControls';
import { SubmitConfirmDialog } from '@/components/attempt/SubmitConfirmDialog';
import { SubmittingOverlay } from '@/components/attempt/SubmittingOverlay';
import { Question } from '@/types/quiz';
import { Attempt } from '@/types/attempt';
import { Box, Container } from '@mui/material';

export default function TakeQuiz() {
    const { id: quizId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Quiz data fetching with React Query
    const { data: quiz, isLoading, error: fetchError } = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: () => quizzesApi.getById(quizId!),
        enabled: !!quizId,
    });

    // Local state
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, string>>(new Map());
    const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lastSavedAnswers = useRef<Map<string, string>>(new Map());
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const camera = useWebcam();

    // Start exam mutation
    const startExamMutation = useMutation({
        mutationFn: () => attemptsApi.start(quizId!),
        onSuccess: (newAttempt) => {
            setAttempt(newAttempt);
            setStarted(true);
        },
        onError: () => {
            setError("Failed to start exam session. Please try again.");
        },
    });

    const { enqueueSnackbar } = useSnackbar();

    // Submit exam mutation
    const submitExamMutation = useMutation({
        mutationFn: () => attemptsApi.submitAttempt(attempt!.id),
        onSuccess: () => {
            enqueueSnackbar('Exam submitted successfully! Redirecting...', {
                variant: 'success',
                autoHideDuration: 2000
            });
            setTimeout(() => {
                navigate(`/result/${attempt!.id}`);
            }, 1000);
        },
        onError: () => {
            setError("Failed to submit exam. Please try again.");
            enqueueSnackbar('Failed to submit exam. Please try again.', { variant: 'error' });
            setShowSubmitModal(false);
        },
    });

    const questions = quiz?.questions || [];

    // Timer with auto-submit
    const triggerAutoSubmit = useCallback(() => {
        if (attempt && !submitExamMutation.isPending) {
            handleSubmitAttempt();
        }
    }, [attempt, submitExamMutation.isPending]);

    const timer = useExamTimer({
        expiresAt: attempt?.expires_at,
        onTimeUp: triggerAutoSubmit
    });

    // Answer management
    const saveAnswerToServer = useCallback(async (questionId: string, answer: string) => {
        if (!attempt) return;
        if (lastSavedAnswers.current.get(questionId) === answer) return;

        try {
            await attemptsApi.submitAnswer(attempt.id, { question_id: questionId, selected_answer: answer });
            lastSavedAnswers.current.set(questionId, answer);
        } catch (err) {
            // Silent fail
        }
    }, [attempt]);

    const handleAnswerSelect = useCallback((questionId: string, answer: string) => {
        setAnswers(prev => {
            const next = new Map(prev);
            next.set(questionId, answer);
            return next;
        });

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveAnswerToServer(questionId, answer);
        }, 1000);
    }, [saveAnswerToServer]);

    const handleToggleMark = (questionId: string) => {
        setMarkedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    };

    // Navigation
    const handleQuestionNavigation = useCallback((newIndex: number) => {
        const current = questions[currentQuestionIndex];
        const currentAnswer = current && answers.get(current.id);

        if (current && currentAnswer && lastSavedAnswers.current.get(current.id) !== currentAnswer) {
            saveAnswerToServer(current.id, currentAnswer);
        }

        setCurrentQuestionIndex(newIndex);
    }, [questions, currentQuestionIndex, answers, saveAnswerToServer]);

    const handlePrevious = () => {
        handleQuestionNavigation(Math.max(0, currentQuestionIndex - 1));
    };

    const handleNext = () => {
        handleQuestionNavigation(Math.min(questions.length - 1, currentQuestionIndex + 1));
    };

    // Submission
    const handleSubmitAttempt = async () => {
        if (!attempt) return;

        const current = questions[currentQuestionIndex];
        const currentAnswer = current && answers.get(current.id);

        if (current && currentAnswer && lastSavedAnswers.current.get(current.id) !== currentAnswer) {
            try {
                await attemptsApi.submitAnswer(attempt.id, { question_id: current.id, selected_answer: currentAnswer });
            } catch (e) {
                // Proceed with submit anyway
            }
        }

        submitExamMutation.mutate();
    };

    // Computed values
    const currentQuestion = questions[currentQuestionIndex];
    const questionIds = useMemo(() => questions.map((q: Question) => q.id), [questions]);
    const isSubmitting = startExamMutation.isPending || submitExamMutation.isPending;

    // Render states
    if (isLoading) return <LoadingState />;

    if (fetchError || error) {
        return <ErrorDisplay message={error || "Failed to load quiz metadata."} onRetry={() => window.location.reload()} />;
    }

    if (!started) {
        return (
            <WebcamPermissionModal
                isOpen={true}
                onStartExam={() => startExamMutation.mutate()}
                onRequestPermission={camera.requestPermission}
                stream={camera.stream}
                hasPermission={camera.hasPermission}
                isLoading={camera.isLoading}
                error={camera.error}
            />
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
            <ExamHeader
                quizTitle={quiz?.title}
                formattedTime={timer.formattedTime}
                progress={timer.progress}
                isTimeLow={timer.timeLeft < 300} // 5 mins
                onSubmit={() => setShowSubmitModal(true)}
            />

            <Container maxWidth="xl" sx={{ flex: 1, py: 4, display: 'flex', gap: 3 }}>
                <QuizSidebar
                    stream={camera.stream}
                    totalQuestions={questions.length}
                    currentIndex={currentQuestionIndex}
                    answers={answers}
                    markedQuestions={markedQuestions}
                    questionIds={questionIds}
                    onNavigate={handleQuestionNavigation}
                />

                <Box flex={1}>
                    {currentQuestion && (
                        <QuestionCard
                            question={currentQuestion}
                            questionNumber={currentQuestionIndex + 1}
                            selectedAnswer={answers.get(currentQuestion.id)}
                            onAnswerSelect={(ans) => handleAnswerSelect(currentQuestion.id, ans)}
                            isMarked={markedQuestions.has(currentQuestion.id)}
                            onToggleMark={() => handleToggleMark(currentQuestion.id)}
                        />
                    )}

                    <QuestionControls
                        currentIndex={currentQuestionIndex}
                        totalQuestions={questions.length}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                        onFinish={() => setShowSubmitModal(true)}
                    />
                </Box>
            </Container>

            <SubmitConfirmDialog
                open={showSubmitModal}
                answeredCount={answers.size}
                totalQuestions={questions.length}
                markedCount={markedQuestions.size}
                isSubmitting={isSubmitting}
                onConfirm={handleSubmitAttempt}
                onCancel={() => setShowSubmitModal(false)}
            />

            <SubmittingOverlay open={isSubmitting && !showSubmitModal} />
        </Box>
    );
}
