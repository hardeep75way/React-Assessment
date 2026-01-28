import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { quizzesApi } from '@/api/quizzes';
import { usersApi } from '@/api/users';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Chip,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import { Assignment as AssignIcon, ArrowBack } from '@mui/icons-material';

const assignmentSchema = yup.object({
    quizId: yup.string().required('Quiz is required'),
    userIds: yup.array().of(yup.string().required()).min(1, 'Select at least one user').required('Users are required'),
    dueDate: yup.string().nullable()
});

interface AssignmentFormData {
    quizId: string;
    userIds: string[];
    dueDate: string | null;
}

export default function AssignQuizPage() {
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => quizzesApi.getAll()
    });

    const { data: users, isLoading: loadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersApi.getAll()
    });

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AssignmentFormData>({
        resolver: yupResolver(assignmentSchema) as any,
        defaultValues: {
            quizId: '',
            userIds: [],
            dueDate: null
        }
    });

    const selectedUserIds = watch('userIds');

    const assignMutation = useMutation({
        mutationFn: async (data: AssignmentFormData) => {
            await quizzesApi.assign(data.quizId, {
                user_ids: data.userIds,
                due_date: data.dueDate || null
            });
        },
        onSuccess: () => {
            setSnackbar({
                open: true,
                message: 'Quiz assigned successfully!',
                severity: 'success'
            });
            // Reset form
            setValue('quizId', '');
            setValue('userIds', []);
            setValue('dueDate', null);
        },
        onError: (error: any) => {
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || 'Failed to assign quiz',
                severity: 'error'
            });
        }
    });

    const onSubmit = useCallback(handleSubmit((data) => {
        assignMutation.mutate(data);
    }), [assignMutation, handleSubmit]);

    const handleUserChange = (event: any) => {
        const value = event.target.value;
        setValue('userIds', typeof value === 'string' ? value.split(',') : value, { shouldValidate: true });
    };

    const isLoading = loadingQuizzes || loadingUsers;

    if (isLoading) {
        return (
            <Box display="flex" height="100vh" alignItems="center" justifyContent="center">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/admin/dashboard')}
                sx={{ mb: 3 }}
            >
                Back to Dashboard
            </Button>

            <Paper elevation={2} sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <AssignIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1">
                        Assign Quiz to Users
                    </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={4}>
                    Select a quiz and users to assign it to. Users will be able to take the quiz from their dashboard.
                </Typography>

                <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Quiz Selection */}
                    <FormControl fullWidth error={!!errors.quizId}>
                        <InputLabel id="quiz-select-label">Select Quiz</InputLabel>
                        <Select
                            labelId="quiz-select-label"
                            label="Select Quiz"
                            {...register('quizId')}
                            value={watch('quizId')}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {quizzes?.filter(q => q.is_published).map(quiz => (
                                <MenuItem key={quiz.id} value={quiz.id}>
                                    {quiz.title}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.quizId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {errors.quizId.message}
                            </Typography>
                        )}
                    </FormControl>

                    {/* User Selection */}
                    <FormControl fullWidth error={!!errors.userIds}>
                        <InputLabel id="users-select-label">Select Users</InputLabel>
                        <Select
                            labelId="users-select-label"
                            multiple
                            value={selectedUserIds}
                            onChange={handleUserChange}
                            input={<OutlinedInput label="Select Users" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((userId) => {
                                        const user = users?.find(u => u.id === userId);
                                        return (
                                            <Chip
                                                key={userId}
                                                label={user?.username || userId}
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {users?.map(user => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.username} ({user.email})
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.userIds && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {errors.userIds.message}
                            </Typography>
                        )}
                    </FormControl>

                    {/* Due Date (Optional) */}
                    <TextField
                        fullWidth
                        label="Due Date (Optional)"
                        type="datetime-local"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        {...register('dueDate')}
                        error={!!errors.dueDate}
                        helperText={errors.dueDate?.message}
                    />

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={assignMutation.isPending}
                        startIcon={assignMutation.isPending ? <CircularProgress size={20} /> : <AssignIcon />}
                    >
                        {assignMutation.isPending ? 'Assigning...' : 'Assign Quiz'}
                    </Button>
                </Box>
            </Paper>

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
