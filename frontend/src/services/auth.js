// src/auth/auth.js
import axios from 'axios';

const API_URL = 'http://localhost:13000'; // Base URL for auth endpoints

export const authService = {
  // Local login (email/password)
  async login(email, password) {
    try {
      console.log(`Logging in with email:${email} and password:${password}`);
      const response = await axios.post(`${API_URL}/login/local`, { email, password });
      console.log('Login response:', response.data);
      localStorage.setItem('token', response.data.token);
      console.log('Login successful, token stored:', response.data.token);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  },

  // Local signup
  async register(username, email, password) {
    try {
      const response = await axios.post(`${API_URL}/register`, { username, email, password });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Registration failed';
    }
  },

  // Logout
  async logout() {
    try {
      const response = await axios.post(`${API_URL}/logout`);
      localStorage.removeItem('token');
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Logout failed';
    }
  },

  // Social login URLs
  getGoogleLoginUrl() {
    return `${API_URL}/login/google`;
  },

  getFacebookLoginUrl() {
    return `${API_URL}/login/facebook`;
  },

  setupAxiosInterceptors() {
    axios.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
};