<template>
  <div class="admin-page">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-title">
          <Shield class="header-icon" />
          <h1>Administration</h1>
        </div>
        <div class="header-stats">
          <button class="back-button" @click="goHome" style="margin-right: 16px;">
            Home
          </button>
          <button class="back-button" @click="goBack" style="margin-right: 16px;">
            ← Go Back
          </button>
          <Users class="stats-icon" />
          <span>{{ users.length }} users</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="search-container">
        <div class="search-wrapper">
          <Search class="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            v-model="searchTerm"
            class="search-input"
          />
        </div>
        <button class="new-user-button" @click="navigateToNewUser">
          <Plus class="plus-icon" />
          New User
        </button>
      </div>

      <!-- Users Grid -->
      <div class="users-grid" v-if="filteredUsers.length > 0">
        <div
          v-for="user in filteredUsers"
          :key="user._id"
          class="user-card"
        >
          <div class="user-content">
            <div class="user-main">
              <!-- Avatar -->
              <div class="user-avatar">
                {{ getInitial(user.name) }}
              </div>
              
              <!-- User Info -->
              <div class="user-info">
                <div class="user-header">
                  <h3 class="user-name">{{ user.name }}</h3>
                  <span :class="['status-badge', user.feedBanned === true ? 'status-banned': 'status-active']">
                    {{ user.feedBanned === true ? 'Banned' : 'Active' }}
                  </span>
                </div>
                <p class="user-username">@{{ user.username }}</p>
                <p class="user-email">{{ user.email }}</p>

                <!-- Profile Link -->
                <router-link :to="`/profile/${user.username}`" class="profile-link">
                  View Profile
                </router-link>
              </div>
            </div>

            <!-- Stats -->
            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-value">{{ user.postsCount }}</span>
                <span>Posts</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ formatDate(user.createdAt) }}</span>
                <span>Joined</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="user-actions">
              <button
                @click="handleAction(user, 'ban')"
                :class="['action-btn', user.feedBanned === true ? 'btn-unban' : 'btn-ban']"
                :title="user.feedBanned === true ? 'Unban user' : 'Ban user'"
              >
                <Ban class="action-icon" />
              </button>
              
              <button
                @click="handleAction(user, 'delete')"
                class="action-btn btn-delete"
                title="Delete user"
              >
                <Trash2 class="action-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <Users class="empty-icon" />
        <h3 class="empty-title">No users found</h3>
        <p class="empty-description">Try adjusting your search terms.</p>
      </div>
    </main>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmDialog" class="modal-overlay" @click="cancelAction">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">
          {{ actionType === 'delete' ? 'Confirm Deletion' : 'Confirm Status Change' }}
        </h3>
        <p class="modal-description">
          <span v-if="actionType === 'delete'">
            Are you sure you want to delete user "{{ selectedUser?.name }}"? This action cannot be undone.
          </span>
          <span v-else>
            Are you sure you want to {{ selectedUser?.feedBanned === true ? 'unban' : 'ban' }} user "{{ selectedUser?.name }}"?
          </span>
        </p>
        <div class="modal-actions">
          <button @click="cancelAction" class="modal-btn btn-cancel">
            Cancel
          </button>
          <button 
            @click="confirmAction" 
            :class="['modal-btn', 'btn-confirm', actionType === 'delete' ? 'delete' : '']"
          >
            {{ actionType === 'delete' ? 'Delete' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { Shield, Users, Search, Ban, Trash2, Plus } from 'lucide-vue-next'
import { useUsersStore } from '../stores/users'
import { useRouter } from 'vue-router'
const router = useRouter()

const users = ref([])
const usersStore = useUsersStore()
const searchTerm = ref('')
const selectedUser = ref(null)
const showConfirmDialog = ref(false)
const actionType = ref('')

const filteredUsers = computed(() => {
  const term = searchTerm.value.toLowerCase()
  return users.value.filter(user =>
    user.name.toLowerCase().includes(term) ||
    user.username.toLowerCase().includes(term)
  )
})

const getInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : ''
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-PT')
}

const handleAction = (user, action) => {
  selectedUser.value = user
  actionType.value = action
  showConfirmDialog.value = true
}

const confirmAction = async () => {
  if (actionType.value === 'delete') {
    const result = await usersStore.deleteUser(selectedUser.value._id)
    if (result) {
      users.value = users.value.filter(u => u._id !== selectedUser.value._id)
    }
  } 
  else if (actionType.value === 'ban') {
    const userIndex = users.value.findIndex(u => u._id === selectedUser.value._id)
    if (userIndex !== -1) {
      const result = await usersStore.updateUser(selectedUser.value._id, { ...users.value[userIndex], feedBanned: !users.value[userIndex].feedBanned })
      if (result) {
        const temp_users = users.value.map(user => 
            user._id === selectedUser.value._id 
            ? { ...user, feedBanned: !user.feedBanned }
            : user
        )
        users.value = temp_users
      }
    }
  }
  cancelAction()
}

const cancelAction = () => {
  showConfirmDialog.value = false
  selectedUser.value = null
  actionType.value = ''
}

onMounted(async () => {
  await usersStore.getUsers()
  users.value = usersStore.users_list
})

function goBack() {
  router.push('/admin')
}

function navigateToNewUser() {
  router.push('/admin/users/new')
}

function goHome() {
  router.push('/home')
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.header {
  border-bottom: 1px solid #e5e5e5;
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 600;
  color: #111111;
  margin: 0;
}

.header-icon {
  width: 32px;
  height: 32px;
  color: #111111;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666666;
}

.stats-icon {
  width: 16px;
  height: 16px;
}


/* Voltar */
.back-button {
  align-self: flex-start;
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.back-button:hover {
  background-color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* Search Bar */
.search-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 16px;
}

.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.new-user-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #111;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.new-user-button:hover {
  background-color: #333;
}

.plus-icon {
  width: 16px;
  height: 16px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-wrapper {
    max-width: 100%;
    width: 100%;
  }
  
  .new-user-button {
    width: 100%;
    justify-content: center;
  }
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  box-shadow: 0 0 0 2px #111111;
  border-color: transparent;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

/* Users Grid */
.users-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 24px;
  transition: box-shadow 0.2s;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

/* Avatar */
.user-avatar {
  width: 48px;
  height: 48px;
  background-color: #111111;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
}

/* User Info */
.user-info {
  flex: 1;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #111111;
  margin: 0;
}

.user-username {
  color: #666666;
  margin: 0 0 2px 0;
}

.user-email {
  font-size: 14px;
  color: #888888;
  margin: 0;
}

/* Status Badge */
.status-badge {
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background-color: #dcfce7;
  color: #166534;
}

.status-banned {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Stats */
.user-stats {
  display: flex;
  gap: 32px;
  align-items: center;
  font-size: 14px;
  color: #666666;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-weight: 600;
  color: #111111;
  display: block;
}

/* Actions */
.user-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon {
  width: 16px;
  height: 16px;
}

.btn-ban {
  background-color: #fef3c7;
  color: #92400e;
}

.btn-ban:hover {
  background-color: #fde68a;
}

.btn-unban {
  background-color: #dcfce7;
  color: #166534;
}

.btn-unban:hover {
  background-color: #bbf7d0;
}

.btn-delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background-color: #fecaca;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 0;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #9ca3af;
  margin: 0 auto 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #111111;
  margin: 0 0 8px 0;
}

.empty-description {
  color: #666666;
  margin: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  margin: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111111;
  margin: 0 0 16px 0;
}

.modal-description {
  color: #666666;
  margin: 0 0 24px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

.btn-confirm {
  background-color: #111111;
  color: white;
}

.btn-confirm:hover {
  background-color: #374151;
}

.btn-confirm.delete {
  background-color: #dc2626;
}

.btn-confirm.delete:hover {
  background-color: #b91c1c;
}

/* Responsive */
@media (max-width: 768px) {
  .user-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .user-stats {
    gap: 16px;
  }

  .header-content {
    padding: 0 16px;
  }

  .main-content {
    padding: 24px 16px;
  }
}
</style>