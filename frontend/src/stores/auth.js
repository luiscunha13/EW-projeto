// src/stores/auth.js
import { defineStore } from 'pinia';
import { authService } from '../services/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    role: null,
    isLoading: false,
    error: null,
    returnUrl: null
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
        const userData = await authService.login(email, password);
        this.user = userData.user;
        localStorage.setItem('user', JSON.stringify(userData.user));
        this.router.push(this.returnUrl || '/');
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async signup(username, email, password) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const userData = await authService.signup(username, email, password);
        this.user = userData.user;
        localStorage.setItem('user', JSON.stringify(userData.user));
        this.router.push('/');
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        await authService.logout();
        this.user = null;
        this.role = null;
        localStorage.removeItem('user');
        this.router.push('/login');
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    initialize(router) {
      // Store router instance for navigation
      this.router = router;
      
      // Check for saved user
      const user = localStorage.getItem('user');
      if (user) {
        try {
          this.user = JSON.parse(user);
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
      
      // Check for return URL
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        this.returnUrl = returnUrl;
        localStorage.removeItem('returnUrl');
      }
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