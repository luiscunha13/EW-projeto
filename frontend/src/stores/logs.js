// src/stores/auth.js
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import axios from 'axios';

const API_URL = 'http://localhost:14000';

export const useLogsStore = defineStore('logs', {
    state: () => ({
        logs: [],
    }),
  
    actions: {
        async getLogs() {
            try {
                const authStore = useAuthStore();
                const response = await axios.get(`${API_URL}/logs`, {
                    headers: {
                        Authorization: `Bearer ${authStore.token}`,
                    },
                });
                console.log('Users fetched successfully:', response.data);
                this.logs = response.data;
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        },

        async addLog(log) {;
            console.log('Adding log:', log);
            try {
                const authStore = useAuthStore();
                const response = await axios.post(`${API_URL}/logs`, 
                    { log }, 
                    { headers: {
                            Authorization: `Bearer ${authStore.token}`,
                        }, 
                    });
                console.log('Log added successfully:', response.data);
                return true
            } catch (error) {
                console.error('Error adding log:', error);
                return false;
            }
        },
    },
});