import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';

const getUserFromStorage = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

const preloadedState = {
    auth: {
        user: getUserFromStorage(),
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        isAuthenticated: !!localStorage.getItem('accessToken'),
    }
};
export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware(),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;