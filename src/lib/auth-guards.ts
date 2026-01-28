import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function attemptTokenRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
        return true;
    }

    if (!refreshToken) {
        return false;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
        });

        const { access_token, refresh_token: new_refresh_token } = response.data;

        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', new_refresh_token);

        try {
            const { store } = await import('@/store');
            const { setCredentials } = await import('@/store/slices/authSlice');

            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                store.dispatch(setCredentials({
                    user,
                    accessToken: access_token,
                    refreshToken: new_refresh_token,
                }));
            }
        } catch (storeError) {
            console.warn('Failed to update Redux store:', storeError);
        }

        return true;
    } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return false;
    }
}

export async function isAuthenticated(): Promise<boolean> {
    return await attemptTokenRefresh();
}

export async function isAdmin(): Promise<boolean> {
    const authenticated = await attemptTokenRefresh();
    if (!authenticated) {
        return false;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        return false;
    }

    try {
        const user = JSON.parse(userStr);
        return user.role === 'admin';
    } catch {
        return false;
    }
}
