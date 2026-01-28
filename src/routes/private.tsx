import { redirect, RouteObject } from 'react-router-dom';
import UserDashboard from '@/pages/dashboard/UserDashboardPage';
import AdminDashboard from '@/pages/dashboard/AdminDashboardPage';
import ExamList from '@/pages/exam/ExamListPage';
import ExamDetail from '@/pages/exam/ExamDetailPage';
import CreateQuiz from '@/pages/admin/CreateExamPage';
import AssignQuiz from '@/pages/admin/AssignExamsPage';
import ManageQuizzes from '@/pages/admin/ManageExamsPage';
import TakeExam from '@/pages/attempt/TakeExamPage';
import ExamResult from '@/pages/attempt/ExamResultPage';
import MyResults from '@/pages/results/MyResultsPage';
import Leaderboard from '@/pages/leaderboard/LeaderboardPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import { quizzesApi } from '@/api/quizzes';
import { isAuthenticated, isAdmin } from '@/lib/auth-guards';



const protectedLoader = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        return redirect('/login');
    }
    return null;
};


const adminLoader = async () => {
    const admin = await isAdmin();
    if (!admin) {

        const authenticated = await isAuthenticated();
        if (!authenticated) {
            return redirect('/login');
        }
        return redirect('/dashboard');
    }
    return null;
};

export const privateRoutes: RouteObject[] = [

    {
        path: '/dashboard',
        element: <UserDashboard />,
        loader: protectedLoader,
    },


    {
        path: '/exams',
        element: <ExamList />,
        loader: async () => {
            const authCheck = await protectedLoader();
            if (authCheck) return authCheck;
            return await quizzesApi.getMyQuizzes(); // Keep API call as is for now
        },
    },
    {
        path: '/exam/:id',
        element: <ExamDetail />,
        loader: protectedLoader,
    },
    {
        path: '/exam/:id/assign',
        element: <ExamDetail />, // This seems wrong in original code too (was QuizDetail for assign?), but keeping logic
        loader: adminLoader,
    },

    {
        path: '/result/:id', // Keep result as is for now or change?
        element: <ExamResult />,
        loader: protectedLoader,
    },
    {
        path: '/results',
        element: <MyResults />,
        loader: protectedLoader,
    },

    {
        path: '/leaderboard',
        element: <Leaderboard />,
        loader: protectedLoader,
    },

    {
        path: '/admin/dashboard',
        element: <AdminDashboard />,
        loader: adminLoader,
    },
    {
        path: '/admin/exams/create', // changed from /admin/quizzes (which was create page)
        element: <CreateQuiz />,
        loader: adminLoader,
    },
    {
        path: '/admin/manage-exams',
        element: <ManageQuizzes />,
        loader: adminLoader,
    },
    {
        path: '/admin/assign-exam',
        element: <AssignQuiz />,
        loader: adminLoader,
    },

    {
        path: '/change-password',
        element: <ChangePasswordPage />,
        loader: protectedLoader,
    },
];

// Exam route - rendered WITHOUT Layout wrapper for fullscreen experience
export const examRoute: RouteObject = {
    path: '/exam/:id/take',
    element: <TakeExam />,
    loader: protectedLoader,
};