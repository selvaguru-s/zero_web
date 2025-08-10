<template>
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">💻 Connected Clients</h2>
      <button 
        class="btn btn-secondary btn-sm" 
        @click="fetchClients" 
        :disabled="loading"
      >
        <span v-if="loading" class="loading-spinner"></span>
        <span v-else>🔄</span>
        Refresh
      </button>
    </div>

    <div v-if="clients.length > 0" class="clients-list">
      <div v-for="client in clients" :key="client.identity_str" class="client-item">
        <div class="client-main">
          <div class="client-id">
            <span class="client-icon">🖥️</span>
            <code>{{ client.identity_str }}</code>
          </div>
          <div class="client-status online">
            <span class="status-dot"></span>
            Online
          </div>
        </div>
        
        <div class="client-details">
          <div class="detail-item">
            <span class="detail-label">Hostname:</span>
            <span class="detail-value">{{ client.hostname || 'Unknown' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Last Seen:</span>
            <span class="detail-value">{{ formatDateTime(client.last_seen) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Connected:</span>
            <span class="detail-value">{{ getConnectionTime(client.created_at || client.last_seen) }}</span>
          </div>
        </div>

        <div class="client-actions">
          <button 
            class="btn btn-outline btn-sm"
            @click="viewLogs(client.identity_str)"
            :disabled="logsLoading"
          >
            📋 View Logs
          </button>
          <button 
            class="btn btn-success btn-sm"
            @click="quickPing(client.identity_str)"
            :disabled="pingLoading"
          >
            🏓 Ping
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <div class="empty-icon">💻</div>
      <div class="empty-text">No clients connected</div>
      <div class="empty-subtext">Clients will appear here when they connect to the ZMQ server</div>
    </div>

    <div v-if="loading && clients.length === 0" class="loading-state">
      <div class="loading-spinner large"></div>
      <div>Loading clients...</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../api.js'

export default {
  name: 'ClientsCard',
  emits: ['error'],
  setup(props, { emit }) {
    const clients = ref([])
    const loading = ref(false)
    const logsLoading = ref(false)
    const pingLoading = ref(false)

    const formatDateTime = (dateStr) => {
      if (!dateStr) return 'Never'
      try {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now - date
        
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        return date.toLocaleDateString()
      } catch {
        return 'Invalid date'
      }
    }

    const getConnectionTime = (dateStr) => {
      if (!dateStr) return 'Unknown'
      try {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now - date
        
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours`
        return `${Math.floor(diff / 86400000)} days`
      } catch {
        return 'Unknown'
      }
    }

    const fetchClients = async () => {
      loading.value = true
      try {
        clients.value = await api.getClients()
      } catch (error) {
        emit('error', 'Failed to fetch clients: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const viewLogs = async (clientId) => {
      logsLoading.value = true
      try {
        const logs = await api.getClientLogs(clientId, 50)
        // For now, just log to console - you could open a modal or new page
        console.log(`Logs for ${clientId}:`, logs)
        // You could emit an event to show logs in a modal
        // emit('show-logs', { clientId, logs })
      } catch (error) {
        emit('error', 'Failed to fetch logs: ' + error.message)
      } finally {
        logsLoading.value = false
      }
    }

    const quickPing = async (clientId) => {
      pingLoading.value = true
      try {
        await api.sendTask(clientId, 'shell', 'echo "ping"')
        emit('success', `Ping sent to ${clientId}`)
      } catch (error) {
        emit('error', 'Failed to send ping: ' + error.message)
      } finally {
        pingLoading.value = false
      }
    }

    // Auto-refresh every 15 seconds
    const startAutoRefresh = () => {
      setInterval(() => {
        if (!loading.value) {
          fetchClients()
        }
      }, 15000)
    }

    onMounted(() => {
      fetchClients()
      startAutoRefresh()
    })

    // Expose method for parent component
    const exposedMethods = {
      fetchClients
    }

    return {
      clients,
      loading,
      logsLoading,
      pingLoading,
      formatDateTime,
      getConnectionTime,
      fetchClients,
      viewLogs,
      quickPing,
      ...exposedMethods
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

.clients-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.client-item {
  background: rgba(45, 45, 68, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.client-item:hover {
  border-color: rgba(102, 126, 234, 0.3);
  background: rgba(45, 45, 68, 0.7);
}

.client-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.client-id {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.client-icon {
  font-size: 16px;
}

.client-id code {
  background: rgba(102, 126, 234, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #a5b4fc;
}

.client-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.client-status.online {
  color: #86efac;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.client-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: 500;
}

.client-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 10px;
}

.btn-secondary {
  background: rgba(75, 85, 99, 0.8);
  color: white;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.btn-outline {
  background: transparent;
  color: #a5b4fc;
  border: 1px solid rgba(165, 180, 252, 0.3);
}

.btn-outline:hover:not(:disabled) {
  background: rgba(165, 180, 252, 0.1);
  border-color: rgba(165, 180, 252, 0.5);
}

.btn-success {
  background: rgba(16, 185, 129, 0.8);
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.btn-success:hover:not(:disabled) {
  background: rgba(16, 185, 129, 1);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.empty-state, .loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  opacity: 0.8;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.large {
  width: 32px;
  height: 32px;
  border-width: 3px;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .client-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .client-details {
    grid-template-columns: 1fr;
  }
  
  .client-actions {
    justify-content: stretch;
  }
  
  .client-actions .btn {
    flex: 1;
  }
}
</style>