<template>
  <div class="bg-gradient-to-br from-gray-800 to-gray-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
    <h2 class="text-xl font-bold text-indigo-400 mb-6 flex items-center space-x-2">
      <span>🚀</span>
      <span>Send Task</span>
    </h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="targetClient" class="block text-sm font-medium text-gray-200 mb-2">
          Target Client
        </label>
        <select 
          id="targetClient" 
          v-model="form.client_id" 
          :disabled="loading || clientsLoading"
          required
          class="w-full px-4 py-3 bg-gray-700/80 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          <option value="">{{ clientsLoading ? 'Loading clients...' : 'Select a client...' }}</option>
          <option 
            v-for="client in clients" 
            :key="client.identity_str" 
            :value="client.identity_str"
          >
            {{ client.identity_str }} 
            <span v-if="client.hostname">({{ client.hostname }})</span>
          </option>
        </select>
      </div>

      <div>
        <label for="taskMode" class="block text-sm font-medium text-gray-200 mb-2">
          Execution Mode
        </label>
        <select 
          id="taskMode" 
          v-model="form.mode" 
          :disabled="loading"
          class="w-full px-4 py-3 bg-gray-700/80 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          <option value="shell">🖥️ Shell Command</option>
          <option value="python">🐍 Python Script</option>
          <option value="file">📁 File Operation</option>
          <option value="custom">⚙️ Custom</option>
        </select>
      </div>

      <div>
        <label for="taskPayload" class="block text-sm font-medium text-gray-200 mb-2">
          {{ payloadLabel }}
        </label>
        <textarea 
          id="taskPayload" 
          v-model="form.payload" 
          :rows="payloadRows"
          :placeholder="payloadPlaceholder"
          :disabled="loading"
          required
          class="w-full px-4 py-3 bg-gray-700/80 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono text-sm resize-y"
        ></textarea>
      </div>

      <button 
        type="submit" 
        :disabled="!isFormValid || loading"
        class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <div v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <span v-else class="text-lg">📤</span>
        <span>{{ loading ? 'Sending Task...' : 'Send Task' }}</span>
      </button>
    </form>

    <div v-if="lastSentTask" class="mt-4 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
      <div class="text-xs text-green-300 font-semibold mb-1">Last Sent Task:</div>
      <div class="text-sm text-green-200 font-mono">{{ lastSentTask }}</div>
    </div>

    <div class="mt-6 pt-6 border-t border-white/10">
      <h3 class="text-lg font-semibold text-indigo-400 mb-4 flex items-center space-x-2">
        <span>⚡</span>
        <span>Quick Actions</span>
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button 
          v-for="action in quickActions"
          :key="action.label"
          @click="setQuickCommand(action.command)"
          :disabled="loading"
          class="px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/20 transition-colors text-xs font-medium disabled:opacity-50"
        >
          {{ action.icon }} {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api.js'

export default {
  name: 'SendTaskCard',
  emits: ['error', 'success', 'task-sent'],
  setup(props, { emit }) {
    const loading = ref(false)
    const clientsLoading = ref(false)
    const clients = ref([])
    const lastSentTask = ref('')

    const form = reactive({
      client_id: '',
      mode: 'shell',
      payload: ''
    })

    const quickActions = [
      { icon: '📂', label: 'List Files', command: 'ls -la' },
      { icon: '🔍', label: 'Processes', command: 'ps aux' },
      { icon: '💾', label: 'Disk Usage', command: 'df -h' },
      { icon: '🐍', label: 'Python Ver', command: 'python3 --version' },
      { icon: '🌐', label: 'Network', command: 'ip addr show' },
      { icon: '📊', label: 'Memory', command: 'free -h' }
    ]

    const isFormValid = computed(() => 
      form.client_id && form.payload.trim().length > 0
    )

    const payloadLabel = computed(() => {
      const labels = {
        shell: 'Shell Command',
        python: 'Python Code',
        file: 'File Path/Operation',
        custom: 'Custom Payload'
      }
      return labels[form.mode] || 'Payload'
    })

    const payloadPlaceholder = computed(() => {
      const placeholders = {
        shell: 'ls -la\necho "Hello World"',
        python: 'print("Hello from Python")\nimport sys\nprint(sys.version)',
        file: '/path/to/file.txt\nread|write|delete',
        custom: 'Enter your custom payload...'
      }
      return placeholders[form.mode] || 'Enter payload...'
    })

    const payloadRows = computed(() => {
      return form.mode === 'python' ? 6 : 4
    })

    const fetchClients = async () => {
      clientsLoading.value = true
      try {
        clients.value = await api.getClients()
      } catch (error) {
        emit('error', 'Failed to fetch clients: ' + error.message)
      } finally {
        clientsLoading.value = false
      }
    }

    const setQuickCommand = (command) => {
      form.mode = 'shell'
      form.payload = command
    }

    const handleSubmit = async () => {
      if (!isFormValid.value) {
        emit('error', 'Please fill in all required fields')
        return
      }

      loading.value = true
      try {
        const result = await api.sendTask(form.client_id, form.mode, form.payload)
        
        lastSentTask.value = result.task_id.substring(0, 8) + '...'
        emit('success', `Task sent successfully! ID: ${result.task_id.substring(0, 8)}...`)
        emit('task-sent', result.task_id)
        
        // Reset payload
        form.payload = ''
        
      } catch (error) {
        emit('error', 'Failed to send task: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchClients()
      // Auto-refresh clients every 10 seconds
      setInterval(() => {
        if (!clientsLoading.value) {
          fetchClients()
        }
      }, 10000)
    })

    return {
      loading,
      clientsLoading,
      clients,
      lastSentTask,
      form,
      quickActions,
      isFormValid,
      payloadLabel,
      payloadPlaceholder,
      payloadRows,
      fetchClients,
      setQuickCommand,
      handleSubmit
    }
  }
}
</script>