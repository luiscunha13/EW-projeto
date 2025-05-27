<template>
    <div class="home-container">
      <!-- Navigation Bar -->
      <nav class="navbar">
        <div class="navbar-brand">My App</div>
        <div class="navbar-menu">
          <button @click="handleLogout" class="logout-button">Logout</button>
        </div>
      </nav>
  
      <!-- Main Content -->
      <main class="main-content">
        <h1>Welcome, {{ user.username }}!</h1>
        <p class="welcome-message">You have successfully logged in to your account.</p>
        
        <div class="user-info">
          <div class="info-card">
            <h3>Account Information</h3>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Role:</strong> {{ user.role }}</p>
            <p><strong>Last Login:</strong> {{ formatDate(user.lastLogin) }}</p>
          </div>
        </div>
  
        <!-- File Upload Section -->
        <div class="upload-section">
          <h2>Upload Files</h2>
          <input type="file" multiple @change="handleFileUpload" class="file-input">
          <button @click="submitFiles" :disabled="!files.length" class="upload-button">
            Submit Files
          </button>
          <div v-if="uploadStatus" class="upload-status">
            {{ uploadStatus }}
          </div>
        </div>
      </main>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import axios from 'axios';
  
  const router = useRouter();
  const authStore = useAuthStore();
  const files = ref([]);
  const uploadStatus = ref('');
  
  const user = computed(() => authStore.user);
  
  const handleLogout = async () => {
    try {
      await authStore.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const handleFileUpload = (event) => {
    files.value = Array.from(event.target.files);
  };
  
  const submitFiles = async () => {
    if (!files.value.length) return;
  
    const formData = new FormData();
    files.value.forEach(file => {
      formData.append('files', file);
    });
  
    try {
      uploadStatus.value = 'Uploading files...';
      const response = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      uploadStatus.value = 'Files uploaded successfully!';
      files.value = [];
    } catch (error) {
      uploadStatus.value = 'Upload failed: ' + error.message;
      console.error('Upload error:', error);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  </script>
  
  <style scoped>
  .home-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: #2c3e50;
    color: white;
  }
  
  .navbar-brand {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .logout-button {
    padding: 0.5rem 1rem;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .logout-button:hover {
    background-color: #c0392b;
  }
  
  .main-content {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  .welcome-message {
    font-size: 1.2rem;
    color: #7f8c8d;
    margin-bottom: 2rem;
  }
  
  .user-info {
    margin: 2rem 0;
  }
  
  .info-card {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .upload-section {
    margin-top: 3rem;
    padding: 2rem;
    border: 1px dashed #ddd;
    border-radius: 8px;
    text-align: center;
  }
  
  .file-input {
    margin: 1rem 0;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 100%;
    max-width: 400px;
  }
  
  .upload-button {
    padding: 0.75rem 1.5rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .upload-button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
  
  .upload-status {
    margin-top: 1rem;
    color: #27ae60;
    font-weight: bold;
  }
  </style>