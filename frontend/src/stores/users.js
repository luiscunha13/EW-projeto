// src/stores/auth.js
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import axios from 'axios';

const AUTH_API_URL = 'http://localhost:13000';

export const useUsersStore = defineStore('users', {
    state: () => ({
        users_list: [],
    }),
  
    getters: {
        hasError: (state) => state.error !== null
    },
  
    actions: {
        async getUsers() {
            try {
                const response = await axios.get(`${AUTH_API_URL}/users`);
                console.log('Users fetched successfully:', response.data);
                this.users_list = response.data;
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        },

        async deleteUser(userId) {
            const authStore = useAuthStore();
            try {
                const response = await axios.delete(`${AUTH_API_URL}/users/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${authStore.token}`,
                    },
                });
                console.log('User deleted successfully:', response.data);
                this.users_list = this.users_list.filter(user => user._id !== userId);
                return true
            } catch (error) {
                console.error('Error deleting user:', error);
                return false;
            }
        },

        async updateUser(userId, userData) {
            const authStore = useAuthStore();
            try {
                const response = await axios.put(`${AUTH_API_URL}/users/${userId}`, userData, {
                    headers: {
                        Authorization: `Bearer ${authStore.token}`,
                    },
                });
                console.log('User updated successfully:', response.data);
                const index = this.users_list.findIndex(user => user._id === userId);
                if (index !== -1) {
                    this.users_list[index] = response.data;
                }
                return true;
            } catch (error) {
                console.error('Error updating user:', error);
                return false;
            }
        },
    },
});