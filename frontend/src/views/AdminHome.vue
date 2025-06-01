<template>
  <div class="admin-home">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-title">
          <Shield class="header-icon" />
          <h1>Admin Panel</h1>
        </div>
        <div>
          <button class="logout-button" @click="goHome">Go Home</button>
          <button class="logout-button" @click="logout">Logout</button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="welcome-section">
        <h2 class="welcome-title">Welcome to the Dashboard</h2>
        <p class="welcome-description">
          Manage users and monitor platform activity
        </p>
      </div>

      <!-- Admin Options Grid -->
      <div class="options-grid">
        <!-- Users Management Card -->
        <router-link to="/admin/users" class="option-card users-card">
          <div class="card-icon">
            <Users class="icon" />
          </div>
          <div class="card-content">
            <h3 class="card-title">User Management</h3>
            <p class="card-description">
              View, ban, and manage user accounts
            </p>
            <div class="card-stats">
              <span class="stat-badge">Manage</span>
            </div>
          </div>
          <div class="card-arrow">
            <ChevronRight class="arrow-icon" />
          </div>
        </router-link>

        <!-- Logs Card -->
        <router-link to="/admin/logs" class="option-card logs-card">
          <div class="card-icon">
            <FileText class="icon" />
          </div>
          <div class="card-content">
            <h3 class="card-title">Activity Logs</h3>
            <p class="card-description">
              Monitor system actions and events
            </p>
            <div class="card-stats">
              <span class="stat-badge">View</span>
            </div>
          </div>
          <div class="card-arrow">
            <ChevronRight class="arrow-icon" />
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Shield, Users, FileText, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
function logout() {
  const authStore = useAuthStore()
  authStore.logout()
  router.push('/login')
}

function goHome() {
  router.push('/home')
}
</script>

<style scoped>
.admin-home {
  min-height: 100vh;
  background-color: #fafafa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.header {
  background-color: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h1 {
  font-size: 28px;
  font-weight: 600;
  color: #111111;
  margin: 0;
}

.header-icon {
  width: 36px;
  height: 36px;
  color: #111111;
}

.logout-button {
  background-color: #ffffff;
  color: black;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.logout-button:hover {
  background-color: black;
  color: white;
  transition: background-color 0.2s ease;
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

/* Welcome Section */
.welcome-section {
  text-align: center;
  margin-bottom: 48px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: #111111;
  margin: 0 0 12px 0;
}

.welcome-description {
  font-size: 18px;
  color: #666666;
  margin: 0;
}

/* Options Grid */
.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.option-card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 32px;
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.option-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #111111, #333333);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.option-card:hover::before {
  transform: scaleX(1);
}

.option-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.card-icon {
  width: 64px;
  height: 64px;
  background-color: #f8f9fa;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.option-card:hover .card-icon {
  background-color: #111111;
}

.option-card:hover .card-icon .icon {
  color: white;
}

.icon {
  width: 32px;
  height: 32px;
  color: #111111;
  transition: color 0.3s ease;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  margin: 0 0 8px 0;
}

.card-description {
  font-size: 14px;
  color: #666666;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.card-stats {
  display: flex;
  gap: 8px;
}

.stat-badge {
  padding: 4px 12px;
  background-color: #f1f5f9;
  color: #475569;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.card-arrow {
  flex-shrink: 0;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.option-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.arrow-icon {
  width: 20px;
  height: 20px;
  color: #666666;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
    height: 64px;
    flex-direction: column;
    align-items: flex-start;
  }

  .logout-button {
    margin-top: 8px;
    align-self: flex-end;
  }

  .header-title h1 {
    font-size: 22px;
  }

  .header-icon {
    width: 28px;
    height: 28px;
  }

  .main-content {
    padding: 24px 16px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .welcome-description {
    font-size: 16px;
  }

  .options-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .option-card {
    padding: 24px;
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}
</style>
