<template>
  <div class="home-container">
    <div class="layout">
      <!-- Left Sidebar -->
      <div class="sidebar left-sidebar">
        <div class="logo">
          <h2>EuBit</h2>
        </div>
        <div class="user-info">
          <div class="avatar">{{ userInitial }}</div>
          <div class="user-details">
            <h3>{{ currentUser.name }}</h3>
            <p>@{{ currentUser.username }}</p>
          </div>
        </div>
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
        </nav>
      </div>

      <!-- Main Feed -->
      <main class="main-content">
        <div class="feed-header">
          <h2>Home</h2>
        </div>

        <div class="posts-container">
          <div v-for="post in posts" :key="post.id" class="post">
            <div class="post-avatar">
              <div class="avatar">{{ getInitial(post.author.name) }}</div>
            </div>
            <div class="post-content">
              <div class="post-header">
                <span class="post-author">{{ post.author.name }}</span>
                <span class="post-username">@{{ post.author.username }}</span>
                <span class="post-time">· {{ formatTime(post.timestamp) }}</span>
              </div>
              <div class="post-text">
                {{ post.content }}
              </div>
              <div class="post-actions">
                <button class="action-button">
                  <span class="icon">💬</span>
                  <span>{{ post.comments }}</span>
                </button>
              </div>
            </div>
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
            v-for="user in users" 
            :key="user.id" 
            class="user-item"
            @click="navigateToUserProfile(user.username)"
          >
            <div class="user-avatar">
              <div class="avatar small">{{ getInitial(user.name) }}</div>
            </div>
            <div class="user-info">
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const newPostContent = ref('');

// Current user data
const currentUser = ref({
  id: 1,
  name: 'John Doe',
  username: 'johndoe',
  email: 'john@example.com'
});

// Computed property to get user initial for avatar
const userInitial = computed(() => {
  return currentUser.value.name.charAt(0);
});

// Sample posts data
const posts = ref([
  {
    id: 1,
    content: 'Just launched my new website! Check it out and let me know what you think.',
    author: {
      name: 'Sarah Johnson',
      username: 'sarahj'
    },
    timestamp: new Date(Date.now() - 25 * 60000), // 25 minutes ago
    likes: 24,
    comments: 5,
    reposts: 2,
    liked: false
  },
  {
    id: 2,
    content: 'Working on a new design system for our product. Excited to share more details soon!',
    author: {
      name: 'Alex Chen',
      username: 'alexc'
    },
    timestamp: new Date(Date.now() - 3 * 3600000), // 3 hours ago
    likes: 42,
    comments: 8,
    reposts: 5,
    liked: true
  },
  {
    id: 3,
    content: 'Just finished reading "Atomic Habits" by James Clear. Highly recommend it to anyone looking to build better habits!',
    author: {
      name: 'Emily Wilson',
      username: 'emilyw'
    },
    timestamp: new Date(Date.now() - 5 * 3600000), // 5 hours ago
    likes: 18,
    comments: 3,
    reposts: 1,
    liked: false
  }
]);

// Sample users data
const users = ref([
  {
    id: 2,
    name: 'Sarah Johnson',
    username: 'sarahj'
  },
  {
    id: 3,
    name: 'Alex Chen',
    username: 'alexc'
  },
  {
    id: 4,
    name: 'Emily Wilson',
    username: 'emilyw'
  },
  {
    id: 5,
    name: 'Michael Brown',
    username: 'michaelb'
  }
]);

// Format time to relative format (e.g., "5m", "2h", "1d")
const formatTime = (timestamp) => {
  const now = new Date();
  const diff = Math.floor((now - timestamp) / 1000); // difference in seconds
  
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

// Get initial for avatar
const getInitial = (name) => {
  return name.charAt(0);
};

// Create a new post
const createPost = () => {
  if (!newPostContent.value.trim()) return;
  
  const newPost = {
    id: posts.value.length + 1,
    content: newPostContent.value,
    author: {
      name: currentUser.value.name,
      username: currentUser.value.username
    },
    timestamp: new Date(),
    likes: 0,
    comments: 0,
    reposts: 0,
    liked: false
  };
  
  posts.value.unshift(newPost);
  newPostContent.value = '';
};

// Like/unlike a post
const likePost = (post) => {
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
};

// Navigate to current user's profile
const navigateToProfile = () => {
  router.push(`/profile/${currentUser.value.username}`);
};

// Navigate to a specific user's profile
const navigateToUserProfile = (username) => {
  router.push(`/profile/${username}`);
};

const navigateToCreatePost = () => {
  router.push(`/createpost`);
};

// Handle logout
const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
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

.logo h2 {
  font-size: 30px;
  font-weight: 600;
  margin-bottom: 40px;
  margin-left: 15px;
  color: #111;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  transition: background-color 0.2s;
  cursor: pointer;
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
</style>