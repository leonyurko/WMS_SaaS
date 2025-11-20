import api from './api';

/**
 * Login user
 */
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  
  if (response.data.status === 'success') {
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  }
  
  throw new Error('Login failed');
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Get stored user data
 */
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Register new user (Admin only)
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data.data.user;
};
