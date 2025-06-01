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
          <button class="nav-item" @click="navigateToMetrics" v-if="canViewMetrics">
            <span>Metrics</span>
          </button>
          <button class="nav-item" @click="handleLogout">
            <span>Logout</span>
          </button>
        </nav>
      </div>

      <!-- Main Profile Content -->
    <main class="main-content">
        <!-- Profile Header - Updated for horizontal layout -->
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
                  <span class="count">{{ filteredPosts.length }}</span>
                  <span>Posts</span>
                </div>
                <!-- Add more stats here if needed -->
              </div>
            </div>
          </div>
        </div>

        <!-- User Posts - Updated with links and individual export buttons -->
        <div class="posts-container">
          <div 
            v-for="post in filteredPosts" 
            :key="post.id" 
            class="post"
            @click="navigateToPost(post.id)"
          >
            <div class="post-avatar">
              <div class="avatar">{{ getInitial(post.author.name) }}</div>
            </div>
            <div class="post-content">
              <div class="post-header">
                <span class="post-author">{{ post.author.name }}</span>
                <span class="post-username">@{{ post.author.username }}</span>
                <span class="post-time">· {{ formatTime(post.timestamp) }}</span>
                <button 
                  class="export-post-button"
                  @click.stop="exportSinglePost(post)"
                >
                  Export
                </button>
              </div>
              <div class="post-text">
                {{ post.content }}
              </div>
              <div class="post-actions">
                <button class="action-button">
                  <span class="icon">💬</span>
                  <span>{{ post.comments }}</span>
                </button>
                <button 
                  class="action-button edit-post-button" 
                  v-if="canEditPost(post)"
                  @click.stop="navigateToEditPost(post.id)"
                >
                  <span class="icon">✏️</span>
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
          <div v-if="filteredPosts.length === 0" class="empty-state">
            <p>No posts to display</p>
          </div>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUsersStore } from '../stores/users';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const usersStore = useUsersStore();

const currentUser = computed(() => authStore.user);
const profileUser = ref({});
const allPosts = ref([]);

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

const filteredPosts = computed(() => {
  return allPosts.value.filter(post => 
    post.author.username === profileUser.value.username
  );
});

const canEditPost = (post) => {
  return currentUser.value.role === 'admin' || 
         post.author.username === currentUser.value.username;
};

// Helper functions
const formatTime = (timestamp) => {
  const now = new Date();
  const diff = Math.floor((now - timestamp) / 1000);
  
  if (diff < 60) return `${diff}s`;
  else if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  else if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  else return `${Math.floor(diff / 86400)}d`;
};

const getInitial = (name) => {
  return name?.charAt(0) || '';
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

const navigateToEditPost = (postId) => {
  router.push(`/editpost/${postId}`);
};

const navigateToMetrics = () => {
  router.push('/metrics');
};

const navigateToPost = (postId) => {
  router.push(`/post/${postId}`);
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const exportPublications = () => {
  const data = {
    user: profileUser.value,
    posts: filteredPosts.value
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profileUser.value.username}-posts.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportSinglePost = (post) => {
  const data = {
    post: post,
    user: profileUser.value
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profileUser.value.username}-post-${post.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Load profile data
const loadProfileData = (username) => {
  const user = usersStore.users_list.find(u => u.username === username);
  profileUser.value = user || {
    name: username,
    username: username
  };
  loadPosts(username);
};

// Simulate loading posts
const loadPosts = (username) => {
  allPosts.value = [
    {
      id: 1,
      content: 'Just launched my new website! Check it out and let me know what you think.',
      author: {
        name: profileUser.value.name,
        username: username
      },
      timestamp: new Date(Date.now() - 25 * 60000),
      likes: 24,
      comments: 5,
      reposts: 2
    },
    {
      id: 2,
      content: 'Working on a new project. Excited to share more details soon!',
      author: {
        name: profileUser.value.name,
        username: username
      },
      timestamp: new Date(Date.now() - 3 * 3600000),
      likes: 42,
      comments: 8,
      reposts: 5
    }
  ].filter(post => post.author.username === username);
};

onMounted(async () => {
  await usersStore.getUsers();
  loadProfileData(route.params.username);
});

watch(
  () => route.params.username,
  (newUsername) => {
    if (newUsername) {
      loadProfileData(newUsername);
    }
  }
);
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

.empty-state {
  padding: 40px;
  text-align: center;
  color: #666;
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