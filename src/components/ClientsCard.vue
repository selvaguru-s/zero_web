<template>
  <div class="bg-gradient-to-br from-gray-800 to-gray-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-indigo-400 flex items-center space-x-2">
        <span>💻</span>
        <span>Connected Clients</span>
      </h2>
      <button 
        @click="fetchClients" 
        :disabled="loading"
        class="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 text-sm"
      >
        <div v-if="loading" class="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
        <span v-else>🔄</span>
        <span>Refresh</span>
      </button>
    </div>

    <div v-if="clients.length > 0" class="space-y-4">
      <div 
        v-for="client in clients" 
        :key="client.identity_str" 
        class="bg-gray-700/50 border border-white/10 rounded-xl p-4 hover:border-indigo-500/30 hover:bg-gray-700/70 transition-all"
      >
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center space-x-2">
            <span class="text-lg">🖥️</span>
            <code class="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs font-mono">
              {{ client.identity_str }}
            </code>
          </div>
          <div class="flex items-center space-x-2 text-xs font-semibold text-green-300">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>ONLINE</span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <div class="space-y-1">
            <div class="text-xs text-gray-400 uppercase tracking-wide font-medium">Hostname</div>
            <div class="text-sm text-gray-200">{{ client.hostname || 'Unknown' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-gray-400 uppercase tracking-wide font-medium">Last Seen</div>
            <div class="text-sm text-gray-200">{{ formatDateTime(client.last_seen) }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-gray-400 uppercase tracking-wide font-medium">Connected</div>
            <div class="text-sm text-gray-200">{{ getConnectionTime(client.created_at || client.last_seen) }}</div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button 
            @click="viewLogs(client.identity_str)"
            :disabled="logsLoading"
            class="px-3 py-1 bg-transparent border border-indigo-300/30 text-indigo-300 rounded-lg hover:bg-indigo-300/10 transition-colors text-xs font-medium disabled:opacity-50"
          >
            📋 View Logs
          </button>
          <button 
            @click="quickPing(client.identity_str)"
            :disabled="pingLoading"
            class="px-3 py-1 bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition-colors text-xs font-medium disabled:opacity-50"
          >
            🏓 Ping
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-12 text-gray-500">
      <div class="text-6xl mb-4 opacity-50">💻</div>
      <div class="text-lg font-semibold mb-2">No clients connected</div>
      <div class="text-sm opacity-80">Clients will appear here when they connect to the ZMQ server</div>
    </div>

    <div v-if="loading && clients.length === 0" class="text-center py-12 text-gray-500">
      <div class="w-8 h-8 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin mx-auto mb-4"></div>
      <div>Loading clients...</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../api.js'

export default {
  name: 'ClientsCard',
  emits: ['error', 'success'],
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
        console.log(`Logs for ${clientId}:`, logs)
        emit('success', `Fetched ${logs.length} log entries for ${clientId}`)
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

    onMounted(() => {
      fetchClients()
      
      // Auto-refresh every 15 seconds
      setInterval(() => {
        if (!loading.value) {
          fetchClients()
        }
      }, 15000)
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