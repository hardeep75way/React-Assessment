import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    CircularProgress
} from '@mui/material';

interface SubmitConfirmDialogProps {
    open: boolean;
    answeredCount: number;
    totalQuestions: number;
    markedCount: number;
    isSubmitting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function SubmitConfirmDialog({
    open,
    answeredCount,
    totalQuestions,
    markedCount,
    isSubmitting,
    onConfirm,
    onCancel
}: SubmitConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={() => !isSubmitting && onCancel()}>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    You have answered {answeredCount} of {totalQuestions} questions.
                    {markedCount > 0 && ` You still have ${markedCount} marked for review.`}
                    <br />
                    Are you sure you want to finish?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
                >
                    Confirm Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}
