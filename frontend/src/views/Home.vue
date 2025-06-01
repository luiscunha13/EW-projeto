<template>
  <div class="home-container">
    <div class="layout">
      <!-- Left Sidebar (unchanged) -->
      <div class="sidebar left-sidebar">
        <div class="logo">
          <img src="@/assets/logo.png" alt="Logo" class="logo" />
        </div>
        <router-link :to="`/profile/${currentUser.username}`" class="user-info">
          <div class="avatar">{{ userInitial }}</div>
          <div class="user-details">
            <h3>{{ currentUser.name }}</h3>
            <p>@{{ currentUser.username }}</p>
          </div>
        </router-link>
        <nav class="navigation">
          <button class="nav-item active">
            <span>Home</span>
          </button>
          <button class="nav-item" @click="navigateToProfile">
            <span>Profile</span>
          </button>
          <button class="nav-item" @click="navigateToCreatePost">
            <span>Create Post</span>
          </button>
          <button class="nav-item" @click="handleLogout">
            <span>Logout</span>
          </button>
          <button v-if="currentUser.role === 'admin'" class="nav-item" @click="navigateToAdmin">
            <span>Admin</span>
          </button>
        </nav>
      </div>

      <!-- Main Feed -->
      <main class="main-content">
        <div class="feed-header">
          <h2>Home</h2>
        </div>

        <div v-if="loading" class="loading">Loading publications...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else class="posts-container">
          <div v-for="publication in publications" :key="publication.id" class="post">
            <div class="post-avatar">
              <div class="avatar">{{ getInitial(publication.user) }}</div>
            </div>
            <div class="post-content">
              <div class="post-header">
                <span class="post-author">{{ publication.user }}</span>
                <span class="post-time">· {{ formatTime(publication.createdAt) }}</span>
              </div>
              <span v-if="publication.occurrenceDate" class="post-time">  Occurred: {{ formatDate(publication.occurrenceDate) }}</span>
              <h3 class="post-title">{{ publication.title }}</h3>
              <div class="post-description">
                {{ publication.description }}
              </div>
              <div class="post-resource-type">
                <span class="resource-tag">{{ publication.resourceType }}</span>
              </div>
              
              <!-- Display files if any -->
              <div v-if="publication.files.length > 0" class="publication-files">
                <div v-for="file in publication.files" :key="file.filename" class="file-preview">
                  <!-- Image display -->
                  <img v-if="isImageFile(file)" 
                    :src="getFileUrl(file)" 
                    :alt="file.filename" 
                    class="file-media"
                    @click="openMediaViewer(getFileUrl(file), $event)">
                  
                  <!-- Video display -->
                  <video v-else-if="isVideoFile(file)" 
                        controls 
                        class="file-media"
                        @click.stop
                        :src="file.fileUrl">
                    Your browser does not support the video tag.
                  </video>

                  <!-- Audio display -->
                  <div v-else-if="isAudioFile(file)" class="audio-player">
                    <audio controls class="audio-element" @click.stop :src="file.fileUrl">
                      Your browser does not support the audio element.
                    </audio>
                    <span class="audio-filename">{{ file.filename }}</span>
                  </div>
                  
                  <!-- Other file types -->
                  <a v-else :href="getFileUrl(file)" 
                    target="_blank" 
                    class="file-link"
                    :download="file.filename">
                    <span class="file-icon">📄</span>
                    {{ file.filename }}
                  </a>
                </div>
              </div>
              
              <div class="post-actions">
                <button class="action-button" @click="toggleComments(publication.id)">
                  <span class="icon">💬</span>
                  <span>{{ publication.comments.length }}</span>
                </button>
              </div>

              <div v-if="expandedComments === publication.id" class="comments-section">
                <div class="comment-list">
                  <div v-for="comment in publication.comments" :key="comment.date" class="comment">
                    <div class="comment-avatar">{{ getInitial(comment.username) }}</div>
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-author">@{{ comment.username }}</span>
                        <span class="comment-time">· {{ formatTime(comment.date) }}</span>
                      </div>
                      <div class="comment-text">{{ comment.comment }}</div>
                    </div>
                  </div>
                </div>
                <div class="comment-input">
                  <input 
                    v-model="newComments[publication.id]" 
                    @keyup.enter="addComment(publication.id)" 
                    placeholder="Write a comment..."
                  />
                  <button @click="addComment(publication.id)">Post</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="publications.length === 0 && !loading" class="empty-state">
          <p>No posts to display</p>
        </div>
      </main>

      <!-- Right Sidebar - User List (unchanged) -->
      <div class="sidebar right-sidebar">
        <div class="sidebar-header">
          <h3>Users</h3>
        </div>
        <div class="users-list">
          <div 
            v-for="user in users" 
            :key="user.id" 
            class="user-item"
            @click="navigateToUserProfile(user.username)"
          >
            <div class="user-avatar">
              <div class="avatar small">{{ getInitial(user.name) }}</div>
            </div>
            <div class="user-details">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-username">@{{ user.username }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUsersStore } from '../stores/users';
import { usePublicationsStore } from '../stores/pubs';

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUsersStore();
const publicationsStore = usePublicationsStore();

const currentUser = ref({});
const users = ref([]);
const loading = ref(false);
const error = ref(null);
const expandedComments = ref(null);
const newComments = ref({});


// Computed property to get user initial for avatar
const userInitial = computed(() => {
  if (!currentUser.value || !currentUser.value.name) {
    return '';
  }
  return currentUser.value.name.charAt(0);
});

// Get publications from store
const publications = computed(() => {
  console.log('USERS',userStore.users_list)
  return Object.values(publicationsStore.activePublications).filter(pub => !userStore.isFeedBanned(pub.user));
});

// Format time to relative format (e.g., "5m", "2h", "1d")
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // difference in seconds
  
  if (diff < 60) {
    return `${diff}s`;
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}m`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h`;
  } else {
    return `${Math.floor(diff / 86400)}d`;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Get initial for avatar
const getInitial = (name) => {
  return name?.charAt(0) || '?';
};

const isImageFile = (file) => {
  return file.mimeType.startsWith('image/') || 
         /\.(png|jpg|jpeg|gif|webp)$/i.test(file.filename);
};

const isVideoFile = (file) => {
  return file.mimeType.startsWith('video/') || 
         /\.(mp4|webm|ogg|mov|avi)$/i.test(file.filename);
};

const isAudioFile = (file) => {
  return file.mimeType.startsWith('audio/') || 
         /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.filename);
};

const getMediaUrl = async (file) => {
  // If we already have a blob URL, use it
  if (file.blobUrl) return file.blobUrl;
  
  // If we have file data, create a blob URL
  if (file.fileData) {
    const blob = new Blob([file.fileData], { type: file.mimeType });
    file.blobUrl = URL.createObjectURL(blob);
    return file.blobUrl;
  }
  
  // If we have a fileUrl, fetch and create blob
  if (file.fileUrl && !file.fileUrl.startsWith('blob:')) {
    try {
      const response = await fetch(file.fileUrl);
      const blob = await response.blob();
      file.blobUrl = URL.createObjectURL(blob);
      return file.blobUrl;
    } catch (error) {
      console.error('Error fetching media file:', error);
      return file.fileUrl; // fallback to original URL
    }
  }
  
  // Fallback to whatever URL is available
  return file.fileUrl;
};

// Helper to get proper file URL
const getFileUrl = (file) => {
  // If it's already a blob URL, use it directly
  console.log('getFileUrl called with file:', file);
  if (file.fileUrl && file.fileUrl.startsWith('blob:')) {
    return file.fileUrl;
  }
  
  // Otherwise create a blob URL from the file data
  if (file.fileData) {
    const blob = new Blob([file.fileData], { type: file.mimeType });
    return URL.createObjectURL(blob);
  }
  
  // Fallback to whatever URL is available
  return file.fileUrl;
};

const openMediaViewer = (mediaUrl, event) => {
  // Prevent default behavior (like downloading)
  event.preventDefault();
  event.stopPropagation();

  // Create a modal to display the image
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';
  modal.style.cursor = 'zoom-out';
  
  // Create the image element
  const img = document.createElement('img');
  img.src = mediaUrl;
  img.style.maxWidth = '90%';
  img.style.maxHeight = '90%';
  img.style.objectFit = 'contain';
  img.style.transition = 'transform 0.1s ease';
  
  // Track zoom level
  let scale = 1;
  
  // Handle wheel event for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    
    // Determine zoom direction
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    
    // Calculate new scale (limit between 0.5 and 5)
    scale = Math.min(Math.max(0.5, scale + delta), 5);
    
    // Apply the scale transform
    img.style.transform = `scale(${scale})`;
  };
  
  // Reset zoom when double-clicked
  const handleDblClick = () => {
    scale = 1;
    img.style.transform = `scale(${scale})`;
  };
  
  // Add event listeners
  modal.addEventListener('wheel', handleWheel, { passive: false });
  img.addEventListener('dblclick', handleDblClick);
  
  // Close modal when clicked
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.removeEventListener('wheel', handleWheel);
      img.removeEventListener('dblclick', handleDblClick);
      document.body.removeChild(modal);
    }
  };
  
  modal.appendChild(img);
  document.body.appendChild(modal);
};

const toggleComments = (publicationId) => {
  expandedComments.value = expandedComments.value === publicationId ? null : publicationId;
};

const addComment = async (publicationId) => {
  if (!newComments.value[publicationId]?.trim()) return;
  
  try {
    await publicationsStore.addComment(
      publicationId,
      authStore.user.username,
      newComments.value[publicationId]
    );
    newComments.value[publicationId] = '';
  } catch (err) {
    console.error('Error adding comment:', err);
  }
};

// Navigation methods (unchanged)
const navigateToProfile = () => {
  router.push(`/profile/${currentUser.value.username}`);
};

const navigateToUserProfile = (username) => {
  router.push(`/profile/${username}`);
};

const navigateToCreatePost = () => {
  router.push(`/createpost`);
};

const navigateToAdmin = () => {
  router.push('/admin')
}

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(async () => {
  currentUser.value = authStore.user;

  try {
    loading.value = true;
    await userStore.getUsers();
    users.value = userStore.users_list;
    
    // Load visible publications
    await publicationsStore.loadPublications('visible');
    console.log('Publications loaded:', publications.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  publications.value.forEach(pub => {
    pub.files.forEach(file => {
      if (file.fileUrl && file.fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(file.fileUrl);
      }
    });
  });
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.home-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  font-family: 'Inter', sans-serif;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

@media (max-width: 1200px) {
  .layout {
    grid-template-columns: 1fr 2fr;
  }
  .right-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .left-sidebar {
    display: none;
  }
}

/* Sidebar Styles */
.sidebar {
  padding: 20px;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
}

.left-sidebar {
  border-right: 1px solid #eaeaea;
  background-color: white;
}

.right-sidebar {
  border-left: 1px solid #eaeaea;
  background-color: white;
}

.logo {
  display: block;
  margin: 0 auto 20px;
  width: 200px;
  height: auto;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  transition: background-color 0.2s;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.user-details {
  margin-left: 12px;
}

.user-details h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.user-details p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.navigation {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: none;
  transition: background-color 0.2s;
  text-align: left;
}

.nav-item:hover {
  background-color: #f5f5f5;
}

.nav-item.active {
  font-weight: 600;
}

.icon {
  margin-right: 12px;
  font-size: 20px;
}

/* Main Content Styles */
.main-content {
  border-left: 1px solid #eaeaea;
  border-right: 1px solid #eaeaea;
  background-color: white;
  min-height: 100vh;
}

.feed-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eaeaea;
  position: sticky;
  top: 0;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  z-index: 10;
}

.feed-header h2 {
  font-size: 25px;
  font-weight: 600;
  margin: 0;
}

/* Posts Styles */
.posts-container {
  display: flex;
  flex-direction: column;
}

.post {
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid #eaeaea;
}

.post-avatar {
  margin-right: 12px;
}

.post-content {
  flex: 1;
}

.post-header {
  margin-bottom: 4px;
}

.post-author {
  font-weight: 600;
  margin-right: 4px;
}

.post-username, .post-time {
  color: #666;
  font-size: 14px;
}

.post-text {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.post-actions {
  display: flex;
  gap: 16px;
}

.post-title {
  font-size: 20px;
  font-weight: 600;
  margin: 8px 0;
  line-height: 1.3;
}

.post-description {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 12px;
  color: #333;
}

.post-resource-type {
  margin-bottom: 12px;
}

.resource-tag {
  display: inline-block;
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

/* File display styles */
.publication-files {
  margin: 15px 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.modal-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.file-media {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  object-fit: contain;
  cursor: pointer;
  background-color: #f5f5f5;
  display: block; /* Ensure proper display */
}

.file-preview img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 400px;
}

.file-media:hover {
  opacity: 0.9;
}

.audio-player {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.audio-element {
  width: 100%;
}

.audio-filename {
  font-size: 14px;
  color: #666;
  word-break: break-all;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  color: #333;
  text-decoration: none;
}

.file-link:hover {
  background-color: #e0e0e0;
}

.file-icon {
  font-size: 18px;
}

/* For single file display */
.publication-files.single-file {
  grid-template-columns: 1fr;
}

/* For multiple files */
.publication-files.multiple-files {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #666;
  font-size: 14px;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.action-button .icon {
  margin-right: 4px;
}

.liked {
  color: #e0245e;
}

.comments-section {
  margin-top: 15px;
  border-top: 1px solid #eaeaea;
  padding-top: 10px;
}

.comment-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.comment {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #111;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 10px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  font-size: 14px;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 600;
  color: #333;
}

.comment-time {
  color: #666;
  font-size: 12px;
}

.comment-text {
  font-size: 14px;
  line-height: 1.4;
}

.comment-input {
  display: flex;
  margin-top: 10px;
}

.comment-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.comment-input button {
  margin-left: 8px;
  padding: 8px 16px;
  background-color: #111;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.comment-input button:hover {
  background-color: #1991db;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #666;
}

/* Avatar Styles */
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #111;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
}

.avatar.small {
  width: 36px;
  height: 36px;
  font-size: 14px;
}

/* Right Sidebar Styles */
.sidebar-header {
  padding: 16px 0;
  border-bottom: 1px solid #eaeaea;
}

.sidebar-header h3 {
  font-size: 25px;
  font-weight: 600;
  margin: 0;
}

.users-list {
  margin-top: 16px;
}

.user-item {
  display: flex;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f5f5f5;
}

.user-avatar {
  margin-right: 12px;
  display:flex;
  justify-content: center;
  align-items: center;
}

.user-name {
  font-weight: 600;
  font-size: 16px;
}

.user-username {
  color: #666;
  font-size: 15px;
}

.loading, .error {
  padding: 20px;
  text-align: center;
}

.error {
  color: #ff0000;
}

.publication-files {
  margin: 10px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.file-preview {
  max-width: 100%;
}

.file-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
}

.file-link {
  display: inline-block;
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 4px;
  color: #333;
  text-decoration: none;
}

.file-link:hover {
  background-color: #e0e0e0;
}
</style>