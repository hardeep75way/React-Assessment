import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { attemptsApi } from '@/api/attempts';
import { quizzesApi } from '@/api/quizzes';
import { Question } from '@/types/quiz';
import { Attempt } from '@/types/attempt';
import { useExamSecurity } from './useExamSecurity';

const getStorageKey = (quizId: string) => `exam_state_${quizId}`;

export function useExamSession(quizId?: string) {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const { data: quiz, isLoading: isQuizLoading, error: fetchError } = useQuery({
        queryKey: ['quiz', quizId],
        queryFn: () => quizzesApi.getById(quizId!),
        enabled: !!quizId,
    });

    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, string>>(new Map());
    const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const security = useExamSecurity({ isExamActive: started });

    const lastSavedAnswers = useRef<Map<string, string>>(new Map());
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const restorationAttempted = useRef(false);
    const questions = quiz?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const questionIds = useMemo(() => questions.map((q: Question) => q.id), [questions]);

    const startExamMutation = useMutation({
        mutationFn: () => attemptsApi.start(quizId!),
        onSuccess: (newAttempt) => {
            setAttempt(newAttempt);
            setStarted(true);

            security.enterFullscreen();

            localStorage.setItem(getStorageKey(quizId!), JSON.stringify({
                attemptId: newAttempt.id,
                questionIndex: 0,
                marked: []
            }));
        },
        onError: () => {
            setError("Failed to start exam session. Please try again.");
        },
    });

    const submitExamMutation = useMutation({
        mutationFn: () => attemptsApi.submitAttempt(attempt!.id),
        onSuccess: () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }

            if (quizId) {
                localStorage.removeItem(getStorageKey(quizId));
            }

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
        },
    });

    const saveAnswerToServer = useCallback(async (questionId: string, answer: string) => {
        if (!attempt) return;
        if (lastSavedAnswers.current.get(questionId) === answer) return;

        try {
            await attemptsApi.submitAnswer(attempt.id, { question_id: questionId, selected_answer: answer });
            lastSavedAnswers.current.set(questionId, answer);
        } catch (err) {
            console.error('Failed to save answer:', err);
            enqueueSnackbar('Failed to save answer. Please check your connection.', { variant: 'error' });
        }
    }, [attempt, enqueueSnackbar]);

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

    const handleQuestionNavigation = useCallback((newIndex: number) => {
        const current = questions[currentQuestionIndex];
        const currentAnswer = current && answers.get(current.id);

        if (current && currentAnswer && lastSavedAnswers.current.get(current.id) !== currentAnswer) {
            saveAnswerToServer(current.id, currentAnswer);
        }

        setCurrentQuestionIndex(newIndex);
    }, [questions, currentQuestionIndex, answers, saveAnswerToServer]);

    const handlePrevious = () => handleQuestionNavigation(Math.max(0, currentQuestionIndex - 1));
    const handleNext = () => handleQuestionNavigation(Math.min(questions.length - 1, currentQuestionIndex + 1));

    const handleSubmitAttempt = async () => {
        if (!attempt) return;

        const current = questions[currentQuestionIndex];
        const currentAnswer = current && answers.get(current.id);

        if (current && currentAnswer && lastSavedAnswers.current.get(current.id) !== currentAnswer) {
            try {
                await attemptsApi.submitAnswer(attempt.id, { question_id: current.id, selected_answer: currentAnswer });
            } catch (e) {
                console.error('Failed to save answer:', e);
                enqueueSnackbar('Failed to save answer. Please check your connection.', { variant: 'error' });
            }
        }

        submitExamMutation.mutate();
    };

    useEffect(() => {
        if (restorationAttempted.current || !quizId) return;
        restorationAttempted.current = true;

        const restoreState = async () => {
            const savedState = localStorage.getItem(getStorageKey(quizId));
            if (!savedState) return;

            try {
                const { attemptId, questionIndex, marked } = JSON.parse(savedState);
                const fullAttempt = await attemptsApi.getAttempt(attemptId);

                if (fullAttempt.is_submitted || fullAttempt.status === 'expired') {
                    localStorage.removeItem(getStorageKey(quizId));
                    return;
                }

                setAttempt(fullAttempt);
                setStarted(true);
                setCurrentQuestionIndex(questionIndex || 0);

                if (fullAttempt.answers) {
                    const answerMap = new Map<string, string>();
                    fullAttempt.answers.forEach(a => answerMap.set(a.question_id, a.selected_answer));
                    setAnswers(answerMap);
                }

                if (marked) {
                    setMarkedQuestions(new Set(marked));
                }
            } catch (error) {
                console.error("Failed to restore exam state", error);
                localStorage.removeItem(getStorageKey(quizId));
            }
        };
        restoreState();
    }, [quizId]);

    useEffect(() => {
        if (!started || !attempt || !quizId) return;
        const stateToSave = {
            attemptId: attempt.id,
            questionIndex: currentQuestionIndex,
            marked: Array.from(markedQuestions)
        };
        localStorage.setItem(getStorageKey(quizId), JSON.stringify(stateToSave));
    }, [started, attempt, quizId, currentQuestionIndex, markedQuestions]);

    return {
        quiz,
        attempt,
        questions,
        currentQuestion,
        questionIds,

        isStarted: started,
        currentQuestionIndex,
        answers,
        markedQuestions,
        isLoading: isQuizLoading,
        isSubmitting: startExamMutation.isPending || submitExamMutation.isPending,
        error: error || (fetchError ? "Failed to load exam metadata." : null),

        startExam: startExamMutation.mutate,
        submitExam: handleSubmitAttempt,
        selectAnswer: handleAnswerSelect,
        toggleMark: handleToggleMark,
        navigate: handleQuestionNavigation,
        nextQuestion: handleNext,
        prevQuestion: handlePrevious,


        security
    };
}
