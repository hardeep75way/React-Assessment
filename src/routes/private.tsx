import { redirect, RouteObject } from 'react-router-dom';
import UserDashboard from '@/pages/dashboard/UserDashboardPage';
import AdminDashboard from '@/pages/dashboard/AdminDashboardPage';
import QuizList from '@/pages/quiz/QuizListPage';
import QuizDetail from '@/pages/quiz/QuizDetailPage';
import CreateQuiz from '@/pages/admin/CreateQuizPage';
import AssignQuiz from '@/pages/admin/AssignQuizPage';
import TakeQuiz from '@/pages/attempt/TakeQuizPage';
import QuizResult from '@/pages/attempt/QuizResultPage';
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
        path: '/quizzes',
        element: <QuizList />,
        loader: async () => {
            const authCheck = await protectedLoader();
            if (authCheck) return authCheck;
            return await quizzesApi.getAll();
        },
    },
    {
        path: '/quiz/:id',
        element: <QuizDetail />,
        loader: protectedLoader,
    },
    {
        path: '/quiz/:id/take',
        element: <TakeQuiz />,
        loader: protectedLoader,
    },
    {
        path: '/quiz/:id/assign',
        element: <QuizDetail />,
        loader: adminLoader,
    },

    {
        path: '/result/:id',
        element: <QuizResult />,
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
        path: '/admin/quizzes',
        element: <CreateQuiz />,
        loader: adminLoader,
    },
    {
        path: '/admin/assign-quiz',
        element: <AssignQuiz />,
        loader: adminLoader,
    },

    {
        path: '/change-password',
        element: <ChangePasswordPage />,
        loader: protectedLoader,
    },
];