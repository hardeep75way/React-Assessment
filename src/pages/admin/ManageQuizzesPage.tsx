import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { quizzesApi } from '@/api/quizzes';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import {
    ArrowBack,
    Publish as PublishIcon,
    UnpublishedOutlined as UnpublishIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

interface ApiError {
    response?: {
        data?: {
            detail?: string;
        };
    };
}

export default function ManageQuizzesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const { data: quizzes, isLoading } = useQuery({
        queryKey: ['quizzes', 'all'],
        queryFn: () => quizzesApi.getAllForAdmin()
    });

    const publishMutation = useMutation({
        mutationFn: (quizId: string) => quizzesApi.publish(quizId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            setSnackbar({
                open: true,
                message: 'Quiz published successfully!',
                severity: 'success'
            });
        },
        onError: (error: ApiError) => {
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || 'Failed to publish quiz',
                severity: 'error'
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (quizId: string) => quizzesApi.delete(quizId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            setSnackbar({
                open: true,
                message: 'Quiz deleted successfully!',
                severity: 'success'
            });
        },
        onError: (error: ApiError) => {
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || 'Failed to delete quiz',
                severity: 'error'
            });
        }
    });

    if (isLoading) {
        return (
            <Box display="flex" height="100vh" alignItems="center" justifyContent="center">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/admin/dashboard')}
                sx={{ mb: 3 }}
            >
                Back to Dashboard
            </Button>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Quiz Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage all quizzes, publish drafts, and edit content
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/admin/quizzes/create')}
                >
                    Create New Quiz
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            <TableCell><strong>Title</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell align="center"><strong>Duration</strong></TableCell>
                            <TableCell align="center"><strong>Questions</strong></TableCell>
                            <TableCell align="center"><strong>Status</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {quizzes && quizzes.length > 0 ? (
                            quizzes.map((quiz) => (
                                <TableRow key={quiz.id} hover>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="medium">
                                            {quiz.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                                            {quiz.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        {quiz.duration_minutes} min
                                    </TableCell>
                                    <TableCell align="center">
                                        {quiz.questions?.length || 0}
                                    </TableCell>
                                    <TableCell align="center">
                                        {quiz.is_published ? (
                                            <Chip label="Published" color="success" size="small" />
                                        ) : (
                                            <Chip label="Draft" color="default" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" gap={1} justifyContent="center">
                                            {!quiz.is_published ? (
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => publishMutation.mutate(quiz.id)}
                                                    disabled={publishMutation.isPending}
                                                    title="Publish Quiz"
                                                >
                                                    <PublishIcon fontSize="small" />
                                                </IconButton>
                                            ) : (
                                                <IconButton
                                                    size="small"
                                                    color="default"
                                                    disabled
                                                    title="Already Published"
                                                >
                                                    <UnpublishIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}
                                                title="Edit Quiz"
                                                disabled={quiz.is_published}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this quiz?')) {
                                                        deleteMutation.mutate(quiz.id);
                                                    }
                                                }}
                                                disabled={deleteMutation.isPending}
                                                title="Delete Quiz"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No quizzes found. Create your first quiz to get started!
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
