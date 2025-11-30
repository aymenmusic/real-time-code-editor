import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEditorStore } from './editorStore';

interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  fetchUserData: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
          }

          const data = await response.json();
          set({
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch user data
          await get().fetchUserData();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            isLoading: false,
          });
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, username, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed');
          }

          await response.json();
          
          // After successful registration, login the user
          await get().login(username, password);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            isLoading: false,
          });
        }
      },

      fetchUserData: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const userData = await response.json();
          set({ user: userData });
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      },

      logout: () => {
        // Clear users list when logging out
        useEditorStore.getState().setUsers([]);
        
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage', // name of the item in localStorage
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
