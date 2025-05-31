// src/stores/auth.js
import { defineStore } from 'pinia';
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
    },
});