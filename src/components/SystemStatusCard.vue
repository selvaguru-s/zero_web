<template>
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">📊 System Status</h2>
      <button 
        class="btn btn-secondary btn-sm" 
        @click="fetchStatus" 
        :disabled="loading"
      >
        <span v-if="loading" class="loading-spinner"></span>
        <span v-else>🔄</span>
        Refresh
      </button>
    </div>

    <div v-if="status" class="status-grid">
      <div class="status-item">
        <div class="status-label">MongoDB</div>
        <div class="status-value">
          <span 
            class="status-indicator"
            :class="{ 'connected': status.mongodb_connected, 'disconnected': !status.mongodb_connected }"
          >
            {{ status.mongodb_connected ? '🟢 Connected' : '🔴 Disconnected' }}
          </span>
        </div>
      </div>

      <div class="status-item">
        <div class="status-label">Active Clients</div>
        <div class="status-value">
          <span class="metric-number">{{ status.total_clients }}</span>
        </div>
      </div>

      <div class="status-item">
        <div class="status-label">Total Tasks</div>
        <div class="status-value">
          <span class="metric-number">{{ status.total_tasks }}</span>
        </div>
      </div>

      <div class="status-item">
        <div class="status-label">Authentication</div>
        <div class="status-value">
          <span class="status-indicator connected">
            🔐 Firebase Enabled
          </span>
        </div>
      </div>
    </div>

    <div v-if="lastUpdated" class="last-updated">
      Last updated: {{ formatTime(lastUpdated) }}
    </div>

    <div v-if="!status && !loading" class="empty-state">
      <div class="empty-icon">📊</div>
      <div>Click refresh to load system status</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../api.js'

export default {
  name: 'SystemStatusCard',
  emits: ['error'],
  setup(props, { emit }) {
    const status = ref(null)
    const loading = ref(false)
    const lastUpdated = ref(null)

    const formatTime = (date) => {
      return new Date(date).toLocaleTimeString()
    }

    const fetchStatus = async () => {
      loading.value = true
      try {
        status.value = await api.getSystemStatus()
        lastUpdated.value = new Date()
      } catch (error) {
        emit('error', 'Failed to fetch system status: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // Auto-refresh every 30 seconds
    const startAutoRefresh = () => {
      setInterval(() => {
        if (!loading.value) {
          fetchStatus()
        }
      }, 30000)
    }

    onMounted(() => {
      fetchStatus()
      startAutoRefresh()
    })

    return {
      status,
      loading,
      lastUpdated,
      fetchStatus,
      formatTime
    }
  }
}
</script>

<style scoped>
.card {
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #667eea;
  margin: 0;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background: rgba(75, 85, 99, 0.8);
  color: white;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(75, 85, 99, 1);
  transform: translateY(-1px);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 11px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.status-grid {
  display: grid;
  gap: 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(45, 45, 68, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-label {
  font-weight: 600;
  color: #e2e8f0;
  font-size: 14px;
}

.status-value {
  font-weight: 700;
}

.status-indicator {
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
}

.status-indicator.connected {
  background: rgba(16, 185, 129, 0.2);
  color: #86efac;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-indicator.disconnected {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.metric-number {
  font-size: 24px;
  font-weight: 800;
  color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.last-updated {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>