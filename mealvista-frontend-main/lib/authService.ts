import api from './api';
import { storeToken, clearToken } from './authStorage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface ProfileResponse {
  user: AuthUser;
}

export interface UsersResponse {
  users: User[];
  count?: number;
}

export interface InventoryResponse {
  items?: any[];
  count?: number;
}

// Signup
export const signup = async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/signup', data);
    if (response.data.token) {
      await storeToken(response.data.token);
    }
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Login
export const login = async (data: { email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    if (response.data.token) {
      await storeToken(response.data.token);
    }
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Login with Google
export const loginWithGoogle = async (data: { idToken?: string; accessToken?: string }): Promise<AuthResponse> => {
  try {
    const tokenType = data.idToken ? 'idToken' : 'accessToken';
    console.log('[authService] Calling /api/auth/google with', tokenType);
    const response = await api.post<AuthResponse>('/api/auth/google', data);
    console.log('[authService] Google auth successful, received token');
    if (response.data.token) {
      await storeToken(response.data.token);
    }
    return response.data;
  } catch (error: any) {
    console.error('[authService] Google auth error:', {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      endpoint: error?.config?.url,
      errorMsg: error?.message
    });
    throw error;
  }
};

// Get user profile
export const getProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await api.get<ProfileResponse>('/api/auth/me');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Update user profile
export const updateProfile = async (data: { name?: string; email?: string }): Promise<ProfileResponse> => {
  try {
    const response = await api.put<ProfileResponse>('/api/auth/me', data);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await clearToken();
  } catch (error: any) {
    console.error('Logout error:', error);
    // Clear token even if there's an error
    await clearToken();
  }
};

// Get all users (admin only)
export const getAllUsers = async (): Promise<UsersResponse> => {
  try {
    const response = await api.get<UsersResponse>('/api/admin/users');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await api.delete(`/api/admin/users/${userId}`);
  } catch (error: any) {
    throw error;
  }
};

// Get inventory (admin only)
export const getInventory = async (): Promise<InventoryResponse> => {
  try {
    const response = await api.get<InventoryResponse>('/api/admin/inventory');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
