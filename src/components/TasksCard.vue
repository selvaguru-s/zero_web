<template>
  <div class="card full-width">
    <div class="card-header">
      <h2 class="card-title">📋 Recent Tasks</h2>
      <div class="header-actions">
        <button 
          class="btn btn-secondary btn-sm" 
          @click="fetchTasks" 
          :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>🔄</span>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="tasks.length > 0" class="tasks-container">
      <div class="tasks-header">
        <div class="filter-tabs">
          <button 
            v-for="filter in statusFilters" 
            :key="filter.value"
            class="filter-tab"
            :class="{ active: activeFilter === filter.value }"
            @click="activeFilter = filter.value"
          >
            {{ filter.icon }} {{ filter.label }}
            <span class="count">{{ getFilteredTasks(filter.value).length }}</span>
          </button>
        </div>
      </div>

      <div class="tasks-list">
        <div 
          v-for="task in displayedTasks" 
          :key="task.id" 
          class="task-item"
          :class="'task-' + task.status"
        >
          <div class="task-header">
            <div class="task-id">
              <span class="task-icon">{{ getTaskIcon(task.mode) }}</span>
              <code>{{ task.id.substring(0, 8) }}...</code>
            </div>
            <div class="task-status">
              <span class="status-badge" :class="'status-' + task.status">
                {{ getStatusIcon(task.status) }} {{ task.status.toUpperCase() }}
              </span>
            </div>
          </div>

          <div class="task-details">
            <div class="task-row">
              <span class="task-label">Target:</span>
              <span class="task-value">{{ task.target }}</span>
            </div>
            <div class="task-row">
              <span class="task-label">Mode:</span>
              <span class="task-value">{{ task.mode || 'shell' }}</span>
            </div>
            <div class="task-row">
              <span class="task-label">Created:</span>
              <span class="task-value">{{ formatDateTime(task.created_at) }}</span>
            </div>
            <div class="task-row" v-if="task.completed_at">
              <span class="task-label">Completed:</span>
              <span class="task-value">{{ formatDateTime(task.completed_at) }}</span>
            </div>
            <div class="task-row" v-if="task.exit_code !== null">
              <span class="task-label">Exit Code:</span>
              <span class="task-value" :class="{ 'success': task.exit_code === 0, 'error': task.exit_code !== 0 }">
                {{ task.exit_code }}
              </span>
            </div>
          </div>

          <div class="task-payload">
            <div class="payload-label">Payload:</div>
            <div class="payload-content">
              <pre>{{ task.payload.substring(0, 200) }}{{ task.payload.length > 200 ? '...' : '' }}</pre>
            </div>
          </div>

          <div class="task-actions">
            <button 
              class="btn btn-outline btn-xs"
              @click="viewFullTask(task)"
            >
              👁️ View Details
            </button>
            <button 
              v-if="task.status === 'completed' || task.status === 'failed'"
              class="btn btn-outline btn-xs"
              @click="viewTaskLogs(task)"
            >
              📄 View Logs
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredTasks.length > displayLimit" class="load-more">
        <button class="btn btn-secondary" @click="loadMore">
          Load More Tasks ({{ filteredTasks.length - displayLimit }} remaining)
        </button>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-text">No tasks yet</div>
      <div class="empty-subtext">Tasks will appear here when you send commands to clients</div>
    </div>

    <div v-if="loading && tasks.length === 0" class="loading-state">
      <div class="loading-spinner large"></div>
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
      // You could implement a modal here or navigate to a detail page
      console.log('Full task details:', task)
      // emit('show-task-details', task)
    }

    const viewTaskLogs = async (task) => {
      try {
        const logs = await api.getClientLogs(task.target, 100)
        const taskLogs = logs.filter(log => log.task_id === task.id)
        console.log(`Logs for task ${task.id}:`, taskLogs)
        // emit('show-task-logs', { task, logs: taskLogs })
      } catch (error) {
        emit('error', 'Failed to fetch task logs: ' + error.message)
      }
    }

    // Auto-refresh every 5 seconds
    const startAutoRefresh = () => {
      setInterval(() => {
        if (!loading.value) {
          fetchTasks()
        }
      }, 5000)
    }

    onMounted(() => {
      fetchTasks()
      startAutoRefresh()
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

<style scoped>
.card {
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.full-width {
  grid-column: 1 / -1;
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

.tasks-header {
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(45, 45, 68, 0.5);
  color: #94a3b8;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-tab:hover {
  background: rgba(45, 45, 68, 0.8);
  color: #e2e8f0;
}

.filter-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.task-item {
  background: rgba(45, 45, 68, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.task-item:hover {
  border-color: rgba(102, 126, 234, 0.3);
  background: rgba(45, 45, 68, 0.7);
}

.task-completed {
  border-left: 4px solid #10b981;
}

.task-failed {
  border-left: 4px solid #ef4444;
}

.task-running {
  border-left: 4px solid #3b82f6;
}

.task-queued {
  border-left: 4px solid #f59e0b;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.task-id {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.task-icon {
  font-size: 16px;
}

.task-id code {
  background: rgba(102, 126, 234, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #a5b4fc;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-queued {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-running {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-completed {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.task-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.task-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-value {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: 500;
}

.task-value.success {
  color: #86efac;
}

.task-value.error {
  color: #fca5a5;
}

.task-payload {
  margin-bottom: 16px;
}

.payload-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.payload-content {
  background: rgba(30, 30, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  max-height: 100px;
  overflow-y: auto;
}

.payload-content pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #d1d5db;
  white-space: pre-wrap;
  word-break: break-word;
}

.task-actions {
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

.btn-xs {
  padding: 4px 8px;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.load-more {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
  width: 12px;
  height: 12px;
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

/* Custom scrollbar */
.tasks-list::-webkit-scrollbar {
  width: 6px;
}

.tasks-list::-webkit-scrollbar-track {
  background: rgba(45, 45, 68, 0.5);
  border-radius: 3px;
}

.tasks-list::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.tasks-list::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.7);
}

@media (max-width: 768px) {
  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .task-details {
    grid-template-columns: 1fr;
  }
  
  .filter-tabs {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .filter-tab {
    padding: 6px 12px;
    font-size: 11px;
  }
}
</style>