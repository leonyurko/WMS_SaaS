import { create } from 'zustand';
import * as authService from '../services/authService';

const useAuthStore = create((set) => ({
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const { user } = await authService.login(username, password);
      set({ user, isAuthenticated: true, loading: false });
      return user;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export default useAuthStore;
