import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

export const usePublicationsStore = defineStore('publications', () => {
    const publications = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Helper function to handle ZIP download
    const downloadZip = (data, filename) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    // Fetch all visible publications (for feed)
    const fetchVisiblePublications = async () => {
        try {
            loading.value = true;
            error.value = null;
            const response = await axios.get('http://localhost:14000/api/publications/visible', {
                responseType: 'blob'
            });
            downloadZip(response.data, 'visible_publications.zip');
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
            console.error('Error fetching visible publications:', err);
        } finally {
            loading.value = false;
        }
    };

    // Fetch user publications
    const fetchUserPublications = async (username) => {
        try {
            loading.value = true;
            error.value = null;
            const response = await axios.get(
                `http://localhost:14000/api/publications/user/${username}`, 
                { responseType: 'blob' }
            );
            downloadZip(response.data, `${username}_publications.zip`);
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
            console.error('Error fetching user publications:', err);
        } finally {
            loading.value = false;
        }
    };

    const fetchSelfPublications = async (username) => {
        try {
            loading.value = true;
            error.value = null;
            const response = await axios.get(
                `http://localhost:14000/api/publications/self/${username}`, 
                { responseType: 'blob' }
            );
            downloadZip(response.data, `${username}_publications.zip`);
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
            console.error('Error fetching user publications:', err);
        } finally {
            loading.value = false;
        }
    };

    return {
        publications,
        loading,
        error,
        fetchVisiblePublications,
        fetchUserPublications,
        fetchPublication
    };
});