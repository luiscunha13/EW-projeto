<!-- DebugPublications.vue -->
<template>
    <div class="debug-container">
      <h2>Publications Debug</h2>
      
      <div>
        <button @click="loadVisible">Load Visible</button>
        <button @click="loadUser('testuser')">Load User</button>
        <button @click="loadSelf('testuser')">Load Self</button>
        <button @click="cleanup">Cleanup</button>
      </div>
      
      <div v-if="loading">Loading...</div>
      <div v-if="error" class="error">{{ error }}</div>
      
      <div v-for="pub in Object.values(publications)" :key="pub.id" class="publication">
        <h3>{{ pub.title }} ({{ pub.id }})</h3>
        <p>{{ pub.description }}</p>
        <p>Type: {{ pub.resourceType }}</p>
        <p>User: {{ pub.user }}</p>
        
        <div class="files">
          <h4>Files ({{ pub.files.length }})</h4>
          <div v-for="file in pub.files" :key="file.filename" class="file">
            <h4>Mimetype ({{ file.mimeType }})</h4>
            <p>{{ file.filename }} ({{ file.size }} bytes)</p>
            <div v-if="file.mimeType.startsWith('text/')">
              <button @click="viewFile(file)">View Text</button>
            </div>
            <div v-else-if="file.mimeType.startsWith('image/')">
              <button @click="viewFile(file)">View Image</button>
              <img v-if="previewFile === file" :src="file.fileUrl" width="200">
            </div>
            <div v-else>
              <button @click="downloadFile(file)">Download</button>
            </div>
          </div>
        </div>
        
        <div class="comments">
          <h4>Comments ({{ pub.comments.length }})</h4>
          <div v-for="(comment, index) in pub.comments" :key="index">
            <strong>{{ comment.username }}:</strong> {{ comment.text }}
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';

  import { usePublicationsStore } from '../stores/pubs';
  
  const store = usePublicationsStore();
  const previewFile = ref(null);
  const fileContent = ref('');
  
  const publications = computed(() => store.activePublications);
  const loading = computed(() => store.loading);
  const error = computed(() => store.error);
  
  const loadVisible = async () => {
    await store.loadPublications('visible');
  };
  
  const loadUser = async (username) => {
    await store.loadPublications('user', username);
  };
  
  const loadSelf = async (username) => {
    await store.loadPublications('self', username);
  };
  
  const cleanup = () => {
    store.cleanupActivePublications();
  };
  
  const viewFile = async (file) => {
    previewFile.value = file;
    if (file.mimeType.startsWith('text/')) {
      const response = await fetch(file.fileUrl);
      fileContent.value = await response.text();
    }
  };
  
  const downloadFile = (file) => {
    const a = document.createElement('a');
    a.href = file.fileUrl;
    a.download = file.filename;
    a.click();
  };
  </script>
  
  <style scoped>
  .debug-container {
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  .publication {
    border: 1px solid #ccc;
    padding: 15px;
    margin: 10px 0;
    border-radius: 5px;
  }
  .file {
    margin: 10px 0;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 3px;
  }
  .error {
    color: red;
    margin: 10px 0;
  }
  </style>