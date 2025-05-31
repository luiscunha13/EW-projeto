// src/stores/auth.js
import { defineStore } from 'pinia';
import axios from 'axios';

const AUTH_API_URL = 'http://localhost:13000';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user_id: "",
    token: null,
    role: "",
    username : "",
    isLoading: false,
    error: null,
    tokenValidated: false, // Cache da validação
    lastValidation: null
  }),
  
  getters: {
    hasError: (state) => state.error !== null
  },
  
  actions: {
    async login(username, password) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${AUTH_API_URL}/login`, { username, password });
        if (response.data.success !== true) {
          return { success: false, error: response.data.message };
        }
        this.token = response.data.token;
        this.verifyToken(this.token);
        this.username = username;
        return { success: true };
      } catch (error) {
        this.error = 'Invalid username or password';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async register(username, name, password) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${AUTH_API_URL}/register`, { username, name, password, role: 'user' });
        console.log('Signup response:', response.data);
        if (response.data.success !== true) {
          return { success: false, error: response.data.message };
        }

        this.token = response.token;
        await this.verifyToken(response.token);
        this.username = username;
        return { success: true };
      } catch (error) {
        this.error = 'Error during registration';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async verifyToken(token) {
        if (!token) return false;
  
        try {

          const now = Date.now(); // cache de 5 minutos
          if (this.tokenValidated && this.lastValidation && (now - this.lastValidation < 5 * 60 * 1000)) {
            return true;
          }

          const response = await axios.get(`${AUTH_API_URL}/verify`, {
            headers: { Authorization: `Bearer ${this.token}` }
          });
          console.log('Token verification response:', response.data);
          if (response.data.valid) {
            this.user_id = response.data.user.id;
            this.role = response.data.user.role;
            this.tokenValidated = response.data.valid;
            this.lastValidation = now;
            return true;
          }
          return false; 
      
      } catch (error) {
        console.error('Token validation failed:', error);
        return false;
      }
    },

    async verifyTokenAdmin(token) {
        if (!token) return false;
  
        try {
          const now = Date.now(); // cache de 5 minutos
          if (this.tokenValidated && this.lastValidation && (now - this.lastValidation < 5 * 60 * 1000)) {
            return true;
          }

          const response = await axios.get(`${AUTH_API_URL}/verify`, {
            headers: { Authorization: `Bearer ${this.token}` }
          });

          if (response.data.valid) {
            this.user_id = response.data.user.id;
            this.role = response.data.user.role;
            this.tokenValidated = response.data.valid;
            this.lastValidation = now;
            return true;
          }
          return false; 
      
      } catch (error) {
        console.error('Token validation failed:', error);
        return false;
      }
    },

    logout() {
      this.token = null;
      this.user_id = "";
      this.role = "";
      this.username = "";
      this.tokenValidated = false;
      this.lastValidation = null;
      localStorage.removeItem('token');
    },

    initialize() {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        this.user = this.verifyToken(token);
      }
      axios.interceptors.request.use(config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });
    },
  },
  persist: true
});