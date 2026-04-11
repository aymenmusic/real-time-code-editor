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
            
            // Handle rate limiting
            if (response.status === 429) {
              throw new Error('Too many login attempts. Please try again later.');
            }
            
            // Handle validation errors
            if (errorData.detail && Array.isArray(errorData.detail)) {
              const validationErrors = errorData.detail
                .map((err: any) => err.msg || err.message)
                .join(', ');
              throw new Error(validationErrors);
            }
            
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
            
            // Handle validation errors from Pydantic
            if (errorData.detail && Array.isArray(errorData.detail)) {
              const validationErrors = errorData.detail
                .map((err: any) => err.msg || err.message)
                .join(', ');
              throw new Error(validationErrors);
            }
            
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
        if (!token) {
          // No token, ensure we're not authenticated
          set({ isAuthenticated: false, user: null });
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const maxRetries = 3;
        const retryDelay = 2000; // 2 seconds

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            console.log(`Fetching user data (attempt ${attempt + 1}/${maxRetries})...`);
            
            const response = await fetch(`${apiUrl}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              // Add timeout to avoid hanging
              signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (!response.ok) {
              // Token is invalid or expired - log user out
              if (response.status === 401 || response.status === 403) {
                console.error('Token is invalid or expired. Logging out...');
                get().logout();
                return;
              }
              
              // Server error - might be waking up, retry
              if (response.status >= 500 && attempt < maxRetries - 1) {
                console.log(`Server error (${response.status}), retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
              }
              
              throw new Error(`Failed to fetch user data: ${response.status}`);
            }

            const userData = await response.json();
            set({ 
              user: userData, 
              isAuthenticated: true // Reconfirm authentication on successful fetch
            });
            console.log('Successfully fetched user data');
            return; // Success, exit retry loop
            
          } catch (error) {
            console.error(`Error fetching user data (attempt ${attempt + 1}):`, error);
            
            // If it's the last attempt, handle the error
            if (attempt === maxRetries - 1) {
              // Network error or timeout - likely backend is down or still waking up
              // We'll set isAuthenticated to false to force re-login
              console.error('Failed to fetch user data after retries. Setting auth to false.');
              set({ isAuthenticated: false });
            } else {
              // Wait before retrying
              console.log(`Retrying in ${retryDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }
      },

      logout: () => {
        // Clear users list when logging out
        const editorStore = useEditorStore.getState();
        editorStore.setUsers([]);
        
        // Reset code for current language to default template
        // This preserves the per-language storage system
        const currentLanguage = editorStore.language;
        const defaultCode = currentLanguage === 'python' 
          ? '# Start coding here\n\ndef hello_world():\n    print("Hello, world!")\n\nhello_world()'
          : '// Start coding here\n\nfunction helloWorld() {\n  console.log("Hello, world!");\n}\n\nhelloWorld();';
        editorStore.updateCode(defaultCode);
        
        // Clear chat messages - dynamic import to avoid circular dependency
        import('./chatStore').then(({ useChatStore }) => {
          useChatStore.getState().clearMessages();
        });
        
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
