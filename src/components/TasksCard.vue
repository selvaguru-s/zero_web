<template>
  <div class="bg-gradient-to-br from-gray-800 to-gray-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl col-span-full">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-indigo-400 flex items-center space-x-2">
        <span>📋</span>
        <span>Recent Tasks</span>
      </h2>
      <button 
        @click="fetchTasks" 
        :disabled="loading"
        class="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 text-sm"
      >
        <div v-if="loading" class="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
        <span v-else>🔄</span>
        <span>Refresh</span>
      </button>
    </div>

    <div v-if="tasks.length > 0">
      <!-- Filter Tabs -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button 
          v-for="filter in statusFilters" 
          :key="filter.value"
          @click="activeFilter = filter.value"
          class="px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center space-x-2"
          :class="activeFilter === filter.value 
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-white/10'"
        >
          <span>{{ filter.icon }}</span>
          <span>{{ filter.label }}</span>
          <span class="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {{ getFilteredTasks(filter.value).length }}
          </span>
        </button>
      </div>

      <!-- Tasks List -->
      <div class="space-y-4 max-h-96 overflow-y-auto">
        <div 
          v-for="task in displayedTasks" 
          :key="task.id" 
          class="bg-gray-700/50 border border-white/10 rounded-xl p-4 hover:border-indigo-500/30 hover:bg-gray-700/70 transition-all"
          :class="getTaskBorderClass(task.status)"
        >
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center space-x-2">
              <span class="text-lg">{{ getTaskIcon(task.mode) }}</span>
              <code class="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs font-mono">
                {{ task.id.substring(0, 8) }}...
              </code>
            </div>
            <span 
              class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
              :class="getStatusBadgeClass(task.status)"
            >
              {{ getStatusIcon(task.status) }} {{ task.status }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div class="space-y-1">
              <div class="text-xs text-gray-400 uppercase tracking-wide font-medium">Target</div>
              <div class="text-sm text-gray-200 font-mono">{{ task.target }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-xs text-gray-400 uppercase tracking-wide font-medium">Mode</div>
              <div class="text-sm text-gray-200">{{ task.mode || 'shell' }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-xs text-gray-400 uppercase tracking-wide font-medium">Created</div>
              <div class="text-sm text-gray-200">{{ formatDateTime(task.created_at) }}</div>
            </div>
            <div v-if="task.exit_code !== null" class="space-y-1">
              <div class="text-xs text-gray-400 uppercase tracking-wide font-medium">Exit Code</div>
              <div 
                class="text-sm font-semibold"
                :class="task.exit_code === 0 ? 'text-green-300' : 'text-red-300'"
              >
                {{ task.exit_code }}
              </div>
            </div>
          </div>

          <div class="mb-4">
            <div class="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Payload</div>
            <div class="bg-gray-800/80 border border-white/10 rounded-lg p-3 max-h-24 overflow-y-auto">
              <pre class="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">{{ task.payload.substring(0, 200) }}{{ task.payload.length > 200 ? '...' : '' }}</pre>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button 
              @click="viewFullTask(task)"
              class="px-3 py-1 bg-transparent border border-indigo-300/30 text-indigo-300 rounded-lg hover:bg-indigo-300/10 transition-colors text-xs font-medium"
            >
              👁️ Details
            </button>
            <button 
              v-if="task.status === 'completed' || task.status === 'failed'"
              @click="viewTaskLogs(task)"
              class="px-3 py-1 bg-transparent border border-indigo-300/30 text-indigo-300 rounded-lg hover:bg-indigo-300/10 transition-colors text-xs font-medium"
            >
              📄 Logs
            </button>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="filteredTasks.length > displayLimit" class="text-center mt-6 pt-4 border-t border-white/10">
        <button 
          @click="loadMore"
          class="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          Load More Tasks ({{ filteredTasks.length - displayLimit }} remaining)
        </button>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-12 text-gray-500">
      <div class="text-6xl mb-4 opacity-50">📋</div>
      <div class="text-lg font-semibold mb-2">No tasks yet</div>
      <div class="text-sm opacity-80">Tasks will appear here when you send commands to clients</div>
    </div>

    <div v-if="loading && tasks.length === 0" class="text-center py-12 text-gray-500">
      <div class="w-8 h-8 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin mx-auto mb-4"></div>
      <div>Loading tasks...</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import api from '../api.js'

export default {
  name: 'TasksCard',
  emits: ['error'],
  setup(props, { emit }) {
    const tasks = ref([])
    const loading = ref(false)
    const activeFilter = ref('all')
    const displayLimit = ref(10)

    const statusFilters = [
      { value: 'all', label: 'All', icon: '📋' },
      { value: 'queued', label: 'Queued', icon: '⏳' },
      { value: 'running', label: 'Running', icon: '▶️' },
      { value: 'completed', label: 'Completed', icon: '✅' },
      { value: 'failed', label: 'Failed', icon: '❌' }
    ]

    const getFilteredTasks = (filter) => {
      if (filter === 'all') return tasks.value
      return tasks.value.filter(task => task.status === filter)
    }

    const filteredTasks = computed(() => 
      getFilteredTasks(activeFilter.value)
    )

    const displayedTasks = computed(() => 
      filteredTasks.value.slice(0, displayLimit.value)
    )

    const formatDateTime = (dateStr) => {
      if (!dateStr) return 'Never'
      try {
        return new Date(dateStr).toLocaleString()
      } catch {
        return 'Invalid date'
      }
    }

    const getTaskIcon = (mode) => {
      const icons = {
        shell: '🖥️',
        python: '🐍',
        file: '📁',
        custom: '⚙️'
      }
      return icons[mode] || '📝'
    }

    const getStatusIcon = (status) => {
      const icons = {
        queued: '⏳',
        running: '▶️',
        completed: '✅',
        failed: '❌'
      }
      return icons[status] || '❓'
    }

    const getStatusBadgeClass = (status) => {
      const classes = {
        queued: 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30',
        running: 'bg-blue-900/30 text-blue-300 border border-blue-500/30',
        completed: 'bg-green-900/30 text-green-300 border border-green-500/30',
        failed: 'bg-red-900/30 text-red-300 border border-red-500/30'
      }
      return classes[status] || classes.queued
    }

    const getTaskBorderClass = (status) => {
      const classes = {
        completed: 'border-l-4 border-l-green-500',
        failed: 'border-l-4 border-l-red-500',
        running: 'border-l-4 border-l-blue-500',
        queued: 'border-l-4 border-l-yellow-500'
      }
      return classes[status] || classes.queued
    }

    const fetchTasks = async () => {
      loading.value = true
      try {
        tasks.value = await api.getTasks()
      } catch (error) {
        emit('error', 'Failed to fetch tasks: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const loadMore = () => {
      displayLimit.value += 10
    }

    const viewFullTask = (task) => {
      console.log('Full task details:', task)
      // You could implement a modal here
    }

    const viewTaskLogs = async (task) => {
      try {
        const logs = await api.getClientLogs(task.target, 100)
        const taskLogs = logs.filter(log => log.task_id === task.id)
        console.log(`Logs for task ${task.id}:`, taskLogs)
        // You could implement a modal here
      } catch (error) {
        emit('error', 'Failed to fetch task logs: ' + error.message)
      }
    }

    onMounted(() => {
      fetchTasks()
      
      // Auto-refresh every 5 seconds
      setInterval(() => {
        if (!loading.value) {
          fetchTasks()
        }
      }, 5000)
    })

    // Expose method for parent component
    const exposedMethods = {
      fetchTasks
    }

    return {
      tasks,
      loading,
      activeFilter,
      displayLimit,
      statusFilters,
      filteredTasks,
      displayedTasks,
      formatDateTime,
      getTaskIcon,
      getStatusIcon,
      getStatusBadgeClass,
      getTaskBorderClass,
      getFilteredTasks,
      fetchTasks,
      loadMore,
      viewFullTask,
      viewTaskLogs,
      ...exposedMethods
    }
  }
}
</script>