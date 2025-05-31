<template>
  <div class="logs-container">
    <!-- Header -->
    <div class="logs-header">
      <div class="logs-title">
        <Logs class="icon" />
        <h1>User Logs</h1>
      </div>
      <div>
        <button class="back-button" @click="goBack" style="margin-right: 16px;">
          ← Go Back
          </button>
        <span class="logs-count">{{ filteredLogs.length }} logs</span>
      </div>
    </div>

    <!-- Search -->
    <div class="search-box">
      <SearchIcon class="search-icon" />
      <input
        v-model="search"
        type="text"
        placeholder="Search logs..."
        class="search-input"
      />
    </div>

    <!-- Logs List -->
    <div v-if="filteredLogs.length > 0" class="logs-list">
      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="log-item"
      >
        <div class="log-details">
          <p><strong>User ID:</strong> {{ log.user }}</p>
          <p><strong>Action:</strong> {{ log.action }}</p>
        </div>
        <div class="log-time">
          {{ formatTimestamp(log.timestamp) }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <ArchiveIcon class="empty-icon" />
      <p class="empty-message">No logs found.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLogsStore } from '@/stores/logs'
import { Logs, SearchIcon, ArchiveIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
const router = useRouter()

const logsStore = useLogsStore()
const search = ref('')
const logs = ref([])

const filteredLogs = computed(() =>
  logs.value.filter(
    (log) =>
      log.user.toLowerCase().includes(search.value.toLowerCase()) ||
      log.action.toLowerCase().includes(search.value.toLowerCase()) ||
      log.timestamp.toLowerCase().includes(search.value.toLowerCase())
  )
)

function formatTimestamp(timestamp) {
  return new Date(timestamp)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19)
}

onMounted(() => {
  logsStore.getLogs().then(() => {
    logs.value = logsStore.logs
  })
})

function goBack() {
  router.push('/admin')
}

</script>

<style scoped>
.logs-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: #f9fafb;
}

/* Header */
.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
}

.logs-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logs-title h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.icon {
  width: 24px;
  height: 24px;
  color: #3b82f6;
}

.logs-count {
  font-size: 14px;
  color: #6b7280;
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

/* Search */
.search-box {
  position: relative;
  max-width: 360px;
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

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

/* Logs */
.logs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.log-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s ease;
}

.log-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.log-details p {
  margin: 2px 0;
  font-size: 14px;
  color: #111827;
}

.log-time {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

/* Empty */
.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 48px 0;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  color: #d1d5db;
}

.empty-message {
  font-size: 14px;
  margin: 0;
}
</style>
