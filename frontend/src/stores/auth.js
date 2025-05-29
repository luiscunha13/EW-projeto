// src/stores/auth.js
import { defineStore } from 'pinia';
import { authService } from '../services/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    role: null,
    isLoading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => state.user !== null,
    currentUser: (state) => state.user,
    hasError: (state) => state.error !== null
  },
  
  actions: {
    async login(email, password) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const data = await authService.login(email, password);
        this.token = data.token;
        this.user = this.decodeToken(data.token);
        return { success: true };
      } catch (error) {
        this.error = error.message;
        return { success: false, error: error.message };
      } finally {
        this.isLoading = false;
      }
    },

    async register(username, email, password) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const data = await authService.register(username, email, password);
        this.token = data.token;
        this.user = this.decodeToken(data.token);
        return { success: true };
      } catch (error) {
        this.error = error.message;
        return { success: false, error: error.message };
      } finally {
        this.isLoading = false;
      }
    },

    decodeToken(token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
      } catch (e) {
        return null;
      }
    },

    async logout() {
      await authService.logout();
      this.user = null;
      this.role = null;
    },

    initialize() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        this.user = this.decodeToken(token);
      }
      authService.setupAxiosInterceptors();
    },

    // Social login redirects
    loginWithGoogle() {
      window.location.href = authService.getGoogleLoginUrl();
    },

    loginWithFacebook() {
      window.location.href = authService.getFacebookLoginUrl();
    }
  }
});