<template>
  <div class="bg-gradient-to-br from-gray-800 to-gray-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-indigo-400 flex items-center space-x-2">
        <span>📊</span>
        <span>System Status</span>
      </h2>
      <button 
        @click="fetchStatus" 
        :disabled="loading"
        class="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 text-sm"
      >
        <div v-if="loading" class="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
        <span v-else>🔄</span>
        <span>Refresh</span>
      </button>
    </div>

    <div v-if="status" class="space-y-4">
      <div class="flex justify-between items-center p-4 bg-gray-700/50 border border-white/10 rounded-xl">
        <div class="font-semibold text-gray-200">MongoDB</div>
        <div>
          <span 
            class="px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-2"
            :class="status.mongodb_connected 
              ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
              : 'bg-red-900/30 text-red-300 border border-red-500/30'"
          >
            <span>{{ status.mongodb_connected ? '🟢' : '🔴' }}</span>
            <span>{{ status.mongodb_connected ? 'Connected' : 'Disconnected' }}</span>
          </span>
        </div>
      </div>

      <div class="flex justify-between items-center p-4 bg-gray-700/50 border border-white/10 rounded-xl">
        <div class="font-semibold text-gray-200">Active Clients</div>
        <div class="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          {{ status.total_clients }}
        </div>
      </div>

      <div class="flex justify-between items-center p-4 bg-gray-700/50 border border-white/10 rounded-xl">
        <div class="font-semibold text-gray-200">Total Tasks</div>
        <div class="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          {{ status.total_tasks }}
        </div>
      </div>

      <div class="flex justify-between items-center p-4 bg-gray-700/50 border border-white/10 rounded-xl">
        <div class="font-semibold text-gray-200">Authentication</div>
        <div>
          <span class="px-3 py-1 bg-green-900/30 text-green-300 border border-green-500/30 rounded-full text-sm font-semibold flex items-center space-x-2">
            <span>🔐</span>
            <span>Firebase Enabled</span>
          </span>
        </div>
      </div>
    </div>

    <div v-if="lastUpdated" class="mt-4 pt-4 border-t border-white/10 text-center text-xs text-gray-400">
      Last updated: {{ formatTime(lastUpdated) }}
    </div>

    <div v-if="!status && !loading" class="text-center py-12 text-gray-500">
      <div class="text-6xl mb-4 opacity-50">📊</div>
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

    onMounted(() => {
      fetchStatus()
      
      // Auto-refresh every 30 seconds
      setInterval(() => {
        if (!loading.value) {
          fetchStatus()
        }
      }, 30000)
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