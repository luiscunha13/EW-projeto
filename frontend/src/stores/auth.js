// src/stores/auth.js
import { defineStore } from 'pinia';
import axios from 'axios';
import { useLogsStore } from './logs';

const AUTH_API_URL = 'http://localhost:13000';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user_id: "",
    token: null,
    user: null,
    isLoading: false,
    tokenValidated: false, // Cache da validação
    lastValidation: null,
    authMethod: "local",
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
        await this.verifyToken(this.token);
        
        const logsStore = useLogsStore();
        logsStore.addLog({
          user: this.user.username,
          action: 'Login',
          timestamp: this.user.lastLogin,
        });

        return { success: true };
      } catch (error) {
        return { success: false, error: 'Invalid username or password' };
      } finally {
        this.isLoading = false;
      }
    },

    async register(username, name, password) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${AUTH_API_URL}/register`, { username, name, password, role: 'user' });
        if (response.data.success !== true) {
          return { success: false, error: response.data.message };
        }

        const logsStore = useLogsStore();
        logsStore.addLog({
          user: username,
          action: 'Registration',
          timestamp: response.data.createdAt,
        });

        return { success: true };
      } catch (error) {
        return { success: false, error: 'Error during registration', err: error };
      } finally {
        this.isLoading = false;
      }
    },

    async verifyToken(token) {
        if (!token) return false;
  
        try {

          const now = (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})(); // cache de 5 minutos
          if (this.tokenValidated && this.lastValidation && (now - this.lastValidation < 5 * 60 * 1000)) {
            return true;
          }

          const response = await axios.get(`${AUTH_API_URL}/verify`, {
            headers: { Authorization: `Bearer ${this.token}` }
          });

          if (response.data.valid) {
            this.user_id = response.data.user._id;
            this.user = response.data.user;
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
          const now = ((() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})())(); // cache de 5 minutos
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

    loginWithGoogle() {
      window.location.href = `${AUTH_API_URL}/google`;
    },
    async processGoogleAuth(token) {
      this.isLoading = true;
      this.error = null;
      
      try {
        this.token = token;
        
        // Verificar e buscar dados do usuário
        const isValid = await this.verifyToken(token);
        if (isValid) {
          this.authMethod = "google";
          return { success: true };
        } else {
          throw new Error('Token inválido');
        }
      } catch (error) {
        return { success: false, error: 'Erro ao processar autenticação Google' };
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      // Guardar o token antes de limpar
      const currentToken = this.token;
  
      // Fazer logout no servidor primeiro
      axios.post(`${AUTH_API_URL}/logout`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      })
      .then(() => {
        console.log('Logout no servidor realizado');
      })
      .catch(error => {
        console.error('Logout failed:', error);
      })
      .finally(() => {
        // Limpar dados locais independentemente do resultado
        this.token = null;
        this.user_id = "";
        this.user = null;
        this.tokenValidated = false;
        this.lastValidation = null;
        localStorage.removeItem('token');
      });
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