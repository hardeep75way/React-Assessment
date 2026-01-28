import { Box } from '@mui/material';
import { WebcamPreview } from './WebcamPreview';
import { QuestionNavigation } from './QuestionNavigation';

interface ExamSidebarProps {
    stream: MediaStream | null;
    totalQuestions: number;
    currentIndex: number;
    answers: Map<string, string>;
    markedQuestions: Set<string>;
    questionIds: string[];
    onNavigate: (index: number) => void;
}

export function ExamSidebar({
    stream,
    totalQuestions,
    currentIndex,
    answers,
    markedQuestions,
    questionIds,
    onNavigate
}: ExamSidebarProps) {
    return (
        <Box width={300} display={{ xs: 'none', lg: 'block' }} flexShrink={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 90 }}>
                <WebcamPreview
                    stream={stream}
                    className="h-48 w-full border-2 border-white shadow-md bg-black rounded"
                />

                <QuestionNavigation
                    totalQuestions={totalQuestions}
                    currentIndex={currentIndex}
                    answers={answers}
                    markedQuestions={markedQuestions}
                    questionIds={questionIds}
                    onNavigate={onNavigate}
                />
            </Box>
        </Box>
    );
}
