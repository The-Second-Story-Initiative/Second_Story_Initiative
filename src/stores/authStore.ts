import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

interface ApiResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'learner' | 'mentor' | 'employer' | 'admin';
  avatar_url?: string;
  github_username?: string;
  skills?: string[];
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
}

const API_BASE_URL = '/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json() as ApiResponse;

          if (!response.ok) {
            toast.error(data.message || 'Login failed');
            return false;
          }

          set({ 
            user: data.user!, 
            token: data.token!,
            loading: false 
          });
          
          toast.success('Welcome back!');
          return true;
        } catch (error) {
          console.error('Login error:', error);
          toast.error('Network error. Please try again.');
          return false;
        }
      },

      register: async (email: string, password: string, fullName: string, role: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              email, 
              password, 
              full_name: fullName, 
              role 
            }),
          });

          const data = await response.json() as ApiResponse;

          if (!response.ok) {
            toast.error(data.message || 'Registration failed');
            return false;
          }

          set({ 
            user: data.user!, 
            token: data.token!,
            loading: false 
          });
          
          toast.success('Account created successfully!');
          return true;
        } catch (error) {
          console.error('Registration error:', error);
          toast.error('Network error. Please try again.');
          return false;
        }
      },

      logout: () => {
        const { token } = get();
        
        if (token) {
          fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).catch(console.error);
        }

        set({ user: null, token: null, loading: false });
        toast.success('Logged out successfully');
      },

      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ loading: false });
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Token invalid');
          }

          const data = await response.json() as ApiResponse;
          set({ user: data.user!, loading: false });
        } catch (error) {
          console.error('Auth check error:', error);
          set({ user: null, token: null, loading: false });
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        const { token, user } = get();
        
        if (!token || !user) {
          toast.error('Not authenticated');
          return false;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
          });

          const data = await response.json() as ApiResponse;

          if (!response.ok) {
            toast.error(data.message || 'Profile update failed');
            return false;
          }

          set({ user: { ...user, ...data.user! } });
          toast.success('Profile updated successfully');
          return true;
        } catch (error) {
          console.error('Profile update error:', error);
          toast.error('Network error. Please try again.');
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user 
      }),
    }
  )
);