<template>
  <div class="admin-home">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-title">
          <Shield class="header-icon" />
          <h1>Painel de Administração</h1>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="welcome-section">
        <h2 class="welcome-title">Bem-vindo ao Dashboard</h2>
        <p class="welcome-description">
          Gerir utilizadores e monitorizar a atividade da plataforma
        </p>
      </div>

      <!-- Admin Options Grid -->
      <div class="options-grid">
        <!-- Users Management Card -->
        <router-link to="/admin/usermanagement" class="option-card users-card">
          <div class="card-icon">
            <Users class="icon" />
          </div>
          <div class="card-content">
            <h3 class="card-title">Gestão de Utilizadores</h3>
            <p class="card-description">
              Ver, banir e gerir contas de utilizadores
            </p>
            <div class="card-stats">
              <span class="stat-badge">Administrar</span>
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
            <h3 class="card-title">Logs de Atividade</h3>
            <p class="card-description">
              Monitorizar ações e eventos do sistema
            </p>
            <div class="card-stats">
              <span class="stat-badge">Visualizar</span>
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

<script>
import { Shield, Users, FileText, ChevronRight } from 'lucide-vue-next'

export default {
  name: 'AdminHome',
  components: {
    Shield,
    Users,
    FileText,
    ChevronRight
  }
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

/* Stats Section */
.stats-section {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 32px;
}

.stats-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  margin: 0 0 24px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #111111;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666666;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
    height: 64px;
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

  .stats-section {
    padding: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>