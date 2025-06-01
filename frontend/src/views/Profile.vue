<template>
  <div class="profile-container">
    <div class="layout">
      <!-- Left Sidebar -->
      <div class="sidebar left-sidebar">
        <div class="logo" @click="navigateToHome">
          <img src="@/assets/logo.png" alt="Logo" class="logo" />
        </div>
        <div class="user-info">
          <div class="avatar">{{ userInitial }}</div>
          <div class="user-details">
            <h3>{{ currentUser.name }}</h3>
            <p>@{{ currentUser.username }}</p>
          </div>
        </div>
        <nav class="navigation">
          <button class="nav-item" @click="navigateToHome">
            <span>Home</span>
          </button>
          <button class="nav-item active">
            <span>Profile</span>
          </button>
          <button class="nav-item" @click="navigateToCreatePost">
            <span>Create Post</span>
          </button>
          <button class="nav-item" @click="handleLogout">
            <span>Logout</span>
          </button>
        </nav>
      </div>

      <!-- Main Profile Content -->
      <main class="main-content">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-info">
            <div class="profile-avatar">
              <div class="avatar large">{{ profileInitial }}</div>
            </div>
            <div class="profile-details">
              <div class="profile-top-row">
                <h1>{{ profileUser.name }}</h1>
                <button class="export-button" @click="exportPublications">
                  Export All
                </button>
              </div>
              <p class="username">@{{ profileUser.username }}</p>
              <div class="profile-stats">
                <div class="stat">
                  <span class="count">{{ publications.length }}</span>
                  <span>Posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="error" class="error">{{ error }}</div>
        <div v-else class="posts-container">
          <div v-for="publication in publications" :key="publication.id" class="post">
            <div class="post-avatar">
              <div class="avatar">{{ getInitial(publication.user) }}</div>
            </div>
            <div class="post-content">
              <div class="post-header">
                <span class="post-author">{{ publication.user }}</span>
                <span class="post-time">· {{ formatTime(publication.createdAt) }}</span>
                <button 
                  class="export-post-button"
                  @click.stop="exportSinglePost(publication)"
                >
                  Export
                </button>
                <button 
                  class="edit-post-button" 
                  v-if="canEditPost(publication)"
                  @click.stop="navigateToEditPost(publication)"
                >
                  Edit
                </button>
              </div>
              <span v-if="publication.occurrenceDate" class="post-time">  Occurred: {{ formatDate(publication.occurrenceDate) }}</span>
              <h3 class="post-title">{{ publication.title }}</h3>
              <div class="post-description">
                {{ publication.description }}
              </div>
              <div class="post-resource-type">
                <span class="resource-tag">{{ publication.resourceType }}</span>
                <span v-if="isCurrentUser" class="visibility-tag" :class="{'public': publication.visibility, 'private': !publication.visibility}">
                  {{ publication.visibility ? 'Public' : 'Private' }}
                </span>
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
                <button class="action-button" @click.stop="toggleComments(publication.id)">
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

      <!-- Right Sidebar - User List -->
      <div class="sidebar right-sidebar">
        <div class="sidebar-header">
          <h3>Users</h3>
        </div>
        <div class="users-list">
          <div 
            v-for="user in usersStore.users_list" 
            :key="user.username" 
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
import { ref, computed, onMounted, onUnmounted, watch} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUsersStore } from '../stores/users';
import { useLogsStore } from '@/stores/logs';
import { usePublicationsStore } from '../stores/pubs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const usersStore = useUsersStore();
const logsStore = useLogsStore();
const publicationsStore = usePublicationsStore();

const currentUser = computed(() => authStore.user);
const profileUser = ref({});
const loading = ref(false);
const error = ref(null);
const expandedComments = ref(null);
const newComments = ref({});

const publications = computed(() => {
  return Object.values(publicationsStore.activePublications);
});

// Computed properties
const userInitial = computed(() => {
  return currentUser.value.name?.charAt(0) || '';
});

const profileInitial = computed(() => {
  return profileUser.value.name?.charAt(0) || '';
});

const isCurrentUser = computed(() => {
  return currentUser.value.username === profileUser.value.username;
});

const canViewMetrics = computed(() => {
  return currentUser.value.role === 'admin' || isCurrentUser.value;
});

const canEditPost = (publication) => {
  return currentUser.value.role === 'admin' || 
         publication.user === currentUser.value.username;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper functions
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

const getInitial = (name) => {
  return name?.charAt(0) || '?';
};

const isImageFile = (file) => {
  return file.mimeType?.startsWith('image/') || 
         /\.(png|jpg|jpeg|gif|webp)$/i.test(file.filename);
};

const isVideoFile = (file) => {
  return file.mimeType?.startsWith('video/') || 
         /\.(mp4|webm|ogg|mov|avi)$/i.test(file.filename);
};

const isAudioFile = (file) => {
  return file.mimeType?.startsWith('audio/') || 
         /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.filename);
};

const getFileUrl = (file) => {
  if (file.fileUrl && file.fileUrl.startsWith('blob:')) {
    return file.fileUrl;
  }
  
  if (file.fileData) {
    const blob = new Blob([file.fileData], { type: file.mimeType });
    return URL.createObjectURL(blob);
  }
  
  return file.fileUrl;
};

const openMediaViewer = (mediaUrl, event) => {
  event.preventDefault();
  event.stopPropagation();

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
  
  const img = document.createElement('img');
  img.src = mediaUrl;
  img.style.maxWidth = '90%';
  img.style.maxHeight = '90%';
  img.style.objectFit = 'contain';
  img.style.transition = 'transform 0.1s ease';
  
  let scale = 1;
  
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.min(Math.max(0.5, scale + delta), 5);
    img.style.transform = `scale(${scale})`;
  };
  
  const handleDblClick = () => {
    scale = 1;
    img.style.transform = `scale(${scale})`;
  };
  
  modal.addEventListener('wheel', handleWheel, { passive: false });
  img.addEventListener('dblclick', handleDblClick);
  
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

// Navigation functions
const navigateToHome = () => {
  router.push('/home');
};

const navigateToUserProfile = (username) => {
  router.push(`/profile/${username}`);
};

const navigateToCreatePost = () => {
  router.push('/createpost');
};

const navigateToEditPost = (publication) => {
  router.push({
    path: `/editpost/${publication.id}`,
    state: { publication }
  });
};

const navigateToMetrics = () => {
  router.push('/metrics');
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const exportPublications = async () => {
  try {
    const zip = new JSZip();
    const rootFolder = zip.folder(`${profileUser.value.username}-posts`);
    
    // Create a metadata file with all posts info
    const allPostsMetadata = {
      user: profileUser.value,
      postsCount: publications.value.length,
      exportedAt: new Date().toISOString()
    };
    rootFolder.file('_metadata.json', JSON.stringify(allPostsMetadata, null, 2));
    
    // Process each post
    for (const publication of publications.value) {
      const postFolder = rootFolder.folder(`post-${publication.id}`);
      
      // Add post metadata
      const postMetadata = {
        ...publication,
        // Remove files array from metadata since we're including the actual files
        files: publication.files.map(file => ({
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size
        }))
      };
      postFolder.file('metadata.json', JSON.stringify(postMetadata, null, 2));
      
      // Add files to the post folder
      for (const file of publication.files) {
        try {
          const response = await fetch(getFileUrl(file));
          const blob = await response.blob();
          postFolder.file(file.filename, blob);
        } catch (err) {
          console.error(`Error downloading file ${file.filename} for post ${publication.id}:`, err);
          // Add a placeholder if file download fails
          postFolder.file(`ERROR-${file.filename}.txt`, `Could not download original file: ${err.message}`);
        }
      }
    }
    
    // Generate the zip file with progress indicator
    const loadingMessage = `Preparing export (0/${publications.value.length} posts processed)`;
    const loading = ref(loadingMessage);
    
    const content = await zip.generateAsync(
      { type: 'blob' },
      (metadata) => {
        if (metadata.currentFile) {
          loading.value = `Preparing export (${metadata.percent.toFixed(2)}% complete)`;
        }
      }
    );
    
    saveAs(content, `${profileUser.value.username}-posts-archive.zip`);
    const log = {
      action: `Exported publications from user @${profileUser.value.username}`,
      user: authStore.user.username,
      timestamp: (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()
    }
    console.log(log)
    await logsStore.addLog(log);
    loading.value = null;
  } catch (err) {
    console.error('Error creating posts archive:', err);
    // Fallback to JSON-only export if zip fails
    const data = {
      user: profileUser.value,
      posts: publications.value
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileUser.value.username}-posts.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

const exportSinglePost = async (publication) => {
  try {
    const zip = new JSZip();
    const folder = zip.folder(`${profileUser.value.username}-post-${publication.id}`);
    
    // Add metadata as JSON file
    const metadata = {
      post: publication,
      user: profileUser.value
    };
    folder.file('metadata.json', JSON.stringify(metadata, null, 2));
    
    // Add files to the zip
    for (const file of publication.files) {
      try {
        const response = await fetch(getFileUrl(file));
        const blob = await response.blob();
        folder.file(file.filename, blob);
      } catch (err) {
        console.error(`Error downloading file ${file.filename}:`, err);
        // If fetching fails, you might want to add a placeholder or skip
      }
    }
    
    // Generate the zip file
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${profileUser.value.username}-post-${publication.id}.zip`);
    const log = {
      action: `Exported publication (id: ${publication.id} - title: ${publication.title})`,
      user: authStore.user.username,
      timestamp: (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()
    }
    console.log(log)
    await logsStore.addLog(log);
  } catch (err) {
    console.error('Error creating zip file:', err);
    // Fallback to JSON-only export if zip fails
    const data = {
      post: publication,
      user: profileUser.value
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileUser.value.username}-post-${publication.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

  }
};

// Load profile data
const loadProfileData = async (username) => {
  try {
    loading.value = true;
    error.value = null;
    
    // Find user in store
    const user = usersStore.users_list.find(u => u.username === username);
    profileUser.value = user || {
      name: username,
      username: username
    };
    
    // Load appropriate publications
    if (isCurrentUser.value) {
      await publicationsStore.loadPublications('self', username);
    } else {
      await publicationsStore.loadPublications('user', username);
    }
  } catch (err) {
    error.value = err.message;
    console.error('Error loading profile data:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await usersStore.getUsers();
  loadProfileData(route.params.username);
  
  const log = {
    action: `Visited profile of @${route.params.username}`,
    user: authStore.user.username,
    timestamp: (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()
  }
  await logsStore.addLog(log);
});

watch(
  () => route.params.username,
  async (newUsername) => {
    await loadProfileData(newUsername);
    
    // Update the log for the new profile view
    const log = {
      action: `Visited profile of @${newUsername}`,
      user: authStore.user.username,
      timestamp: (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()
    }
    await logsStore.addLog(log);
  },
  { immediate: false } 
);


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

.logo:hover {
  cursor: pointer;
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

.profile-header {
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
}

.profile-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-details {
  flex: 1;
}

.profile-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.profile-details h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.username {
  color: #666;
  margin: 0 0 12px 0;
}

.profile-stats {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  gap: 4px;
  align-items: center;
}

.count {
  font-weight: 600;
}

.export-button {
  padding: 8px 16px;
  border-radius: 20px;
  background-color: #111;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.export-button:hover {
  background-color: #333;
}

.export-post-button, .edit-post-button {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
  border: none;
}

.export-post-button {
  background-color: #f0f0f0;
  color: #333;
}

.export-post-button:hover {
  background-color: #ddd;
}

.edit-post-button {
  background-color: #111;
  color: white;
}

.edit-post-button:hover {
  background-color: #333;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #666;
}

.avatar.large {
  width: 64px;
  height: 64px;
  font-size: 24px;
}

.post-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
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

.profile-header {
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
}

.profile-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.profile-details {
  flex: 1;
}

.profile-details h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.username {
  color: #666;
  margin: 0 0 16px 0;
}

.profile-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  gap: 4px;
  align-items: center;
}

.count {
  font-weight: 600;
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.export-button {
  padding: 8px 16px;
  border-radius: 20px;
  background-color: #111;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.export-button:hover {
  background-color: #333;
}

.profile-info {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.profile-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.profile-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 8px;
}

.profile-details h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.username {
  color: #666;
  margin: 0 0 12px 0;
}

.profile-stats {
  display: flex;
  gap: 20px;
  margin-top: auto;
}

/* Post Export Button */
.export-post-button {
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s;
  margin-left: auto;
}

.export-post-button:hover {
  background-color: #ddd;
}

/* Make posts clickable */
.post {
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.post:hover {
  background-color: #f9f9f9;
}

.post-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

/* Prevent buttons from triggering post click */
.action-button, 
.export-post-button,
.edit-post-button {
  pointer-events: auto;
  z-index: 2;
}

/* Compact export button */
.export-button {
  padding: 6px 12px;
  border-radius: 4px;
  background-color: #111;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: background-color 0.2s;
  white-space: nowrap;
  height: fit-content;
}

.export-button:hover {
  background-color: #333;
}

.visibility-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  margin-left: 8px;
}

.visibility-tag.public {
  background-color: #e6f7ee;
  color: #0a8150;
}

.visibility-tag.private {
  background-color: #fef0f0;
  color: #de3618;
}

/* Avatar size adjustments */
.avatar.large {
  width: 64px;
  height: 64px;
  font-size: 24px;
}

/* Post content click area */
.post-content-wrapper {
  flex: 1;
  position: relative;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .profile-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .profile-top-row {
    width: 100%;
  }
  
  .profile-stats {
    margin-top: 12px;
  }
  
  .export-post-button {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>    
