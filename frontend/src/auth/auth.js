// src/auth/auth.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/auth'; // Base URL for auth endpoints

export const authService = {
  // Local login (email/password)
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/login/password`, { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  },

  // Local signup
  async signup(username, email, password) {
    try {
      const response = await axios.post(`${API_URL}/signup`, { username, email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Registration failed';
    }
  },

  // Logout
  async logout() {
    try {
      const response = await axios.post(`${API_URL}/logout`);
      return response.data;
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
  }
};