import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import ReactSelect from 'react-select';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { quizzesApi } from '@/api/quizzes';
import { usersApi } from '@/api/users';
import { User } from '@/api/users';
import { Quiz } from '@/types/quiz';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import { Assignment as AssignIcon, ArrowBack } from '@mui/icons-material';

interface SelectOption {
    value: string;
    label?: string;
}

interface ApiError {
    response?: {
        data?: {
            detail?: string;
        };
    };
}

const assignmentSchema = yup.object({
    quizId: yup.string().required('Quiz is required'),
    userIds: yup.array().of(yup.string().required()).min(1, 'Select at least one user').required('Users are required'),
    dueDate: yup.string().optional().nullable()
});

interface AssignmentFormData {
    quizId: string;
    userIds: string[];
    dueDate?: string | null;
}

export default function AssignQuizPage() {
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
        queryKey: ['quizzes', 'all'],
        queryFn: () => quizzesApi.getAllForAdmin()
    });

    const { data: users, isLoading: loadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersApi.getAll()
    });

    const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<AssignmentFormData>({
        resolver: yupResolver(assignmentSchema) as any,
        defaultValues: {
            quizId: '',
            userIds: [],
            dueDate: null
        }
    });

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
        onError: (error: ApiError) => {
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || 'Failed to assign quiz',
                severity: 'error'
            });
        }
    });

    const onSubmit = handleSubmit((data) => {
        assignMutation.mutate(data);
    });



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
                        <Typography variant="subtitle2" mb={1}>Select Quiz</Typography>
                        <Controller
                            name="quizId"
                            control={control}
                            render={({ field }) => (
                                <ReactSelect
                                    {...field}
                                    options={quizzes?.map((q: Quiz) => ({ value: q.id, label: `${q.title} ${!q.is_published ? '(Unpublished)' : ''}` }))}
                                    value={quizzes?.find((q: Quiz) => q.id === field.value) ? { value: field.value, label: quizzes.find((q: Quiz) => q.id === field.value)?.title } : null}
                                    onChange={(val: SelectOption | null) => field.onChange(val?.value)}
                                    placeholder="Search and select a quiz..."
                                    isClearable
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderColor: errors.quizId ? '#d32f2f' : base.borderColor,
                                            '&:hover': {
                                                borderColor: errors.quizId ? '#d32f2f' : base.borderColor,
                                            }
                                        })
                                    }}
                                />
                            )}
                        />
                        {errors.quizId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {errors.quizId.message}
                            </Typography>
                        )}
                    </FormControl>

                    {/* User Selection */}
                    <FormControl fullWidth error={!!errors.userIds}>
                        <Typography variant="subtitle2" mb={1}>Select Users</Typography>
                        <Controller
                            name="userIds"
                            control={control}
                            render={({ field }) => (
                                <ReactSelect
                                    {...field}
                                    isMulti
                                    options={users?.map((u: User) => ({ value: u.id, label: `${u.username} (${u.email})` }))}
                                    value={users?.filter((u: User) => field.value?.includes(u.id)).map((u: User) => ({ value: u.id, label: `${u.username} (${u.email})` }))}
                                    onChange={(vals: readonly SelectOption[]) => field.onChange(vals?.map((v: SelectOption) => v.value))}
                                    placeholder="Search and select users..."
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderColor: errors.userIds ? '#d32f2f' : base.borderColor,
                                            '&:hover': {
                                                borderColor: errors.userIds ? '#d32f2f' : base.borderColor,
                                            }
                                        })
                                    }}
                                />
                            )}
                        />
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
