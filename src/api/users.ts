import { apiClient } from './client';

export interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    created_at: string;
}

export const usersApi = {
    getAll: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },
};
