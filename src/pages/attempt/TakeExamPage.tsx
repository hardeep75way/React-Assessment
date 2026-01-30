import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWebcam } from '@/hooks/useWebcam';
import { useExamTimer } from '@/hooks/useExamTimer';
import WebcamPermissionModal from '@/components/attempt/WebcamPermissionModal';
import { QuestionCard } from '@/components/attempt/QuestionCard';
import { LoadingState } from '@/components/attempt/LoadingState';
import { ErrorDisplay } from '@/components/attempt/ErrorDisplay';
import { ExamHeader } from '@/components/attempt/ExamHeader';
import { ExamSidebar } from '@/components/attempt/ExamSidebar';
import { QuestionControls } from '@/components/attempt/QuestionControls';
import { SubmitConfirmDialog } from '@/components/attempt/SubmitConfirmDialog';
import { SubmittingOverlay } from '@/components/attempt/SubmittingOverlay';
import { SecurityWarning } from '@/components/attempt/SecurityWarning';
import { Box, Container } from '@mui/material';
import { useExamSession } from '@/hooks/useExamSession';

export default function TakeExam() {
    const { id: quizId } = useParams<{ id: string }>();
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    const session = useExamSession(quizId);
    const camera = useWebcam();

    const timer = useExamTimer({
        expiresAt: session.attempt?.expires_at,
        onTimeUp: session.submitExam
    });

    if (session.isLoading) return <LoadingState />;

    if (session.error) {
        return <ErrorDisplay message={session.error} onRetry={() => window.location.reload()} />;
    }

    if (!session.isStarted) {
        return (
            <WebcamPermissionModal
                isOpen={true}
                onStartExam={session.startExam}
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
                quizTitle={session.quiz?.title}
                formattedTime={timer.formattedTime}
                progress={timer.progress}
                isTimeLow={timer.timeLeft < 300} // 5 mins
                onSubmit={() => setShowSubmitModal(true)}
            />

            <Container maxWidth="xl" sx={{ flex: 1, py: 4, display: 'flex', gap: 3 }}>
                <ExamSidebar
                    stream={camera.stream}
                    totalQuestions={session.questions.length}
                    currentIndex={session.currentQuestionIndex}
                    answers={session.answers}
                    markedQuestions={session.markedQuestions}
                    questionIds={session.questionIds}
                    onNavigate={session.navigate}
                />

                <Box flex={1}>
                    {session.currentQuestion && (
                        <QuestionCard
                            question={session.currentQuestion}
                            questionNumber={session.currentQuestionIndex + 1}
                            selectedAnswer={session.answers.get(session.currentQuestion.id)}
                            onAnswerSelect={(ans) => session.selectAnswer(session.currentQuestion!.id, ans)}
                            isMarked={session.markedQuestions.has(session.currentQuestion.id)}
                            onToggleMark={() => session.toggleMark(session.currentQuestion!.id)}
                        />
                    )}

                    <QuestionControls
                        currentIndex={session.currentQuestionIndex}
                        totalQuestions={session.questions.length}
                        onPrevious={session.prevQuestion}
                        onNext={session.nextQuestion}
                        onFinish={() => setShowSubmitModal(true)}
                    />
                </Box>
            </Container>

            <SubmitConfirmDialog
                open={showSubmitModal}
                answeredCount={session.answers.size}
                totalQuestions={session.questions.length}
                markedCount={session.markedQuestions.size}
                isSubmitting={session.isSubmitting}
                onConfirm={session.submitExam}
                onCancel={() => setShowSubmitModal(false)}
            />

            <SubmittingOverlay open={session.isSubmitting && !showSubmitModal} />

            <SecurityWarning
                isOpen={!session.security.isFullscreen && session.isStarted}
                onReEnter={session.security.enterFullscreen}
                violationCount={session.security.violationCount}
            />
        </Box>
    );
}
