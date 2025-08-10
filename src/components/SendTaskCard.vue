<template>
  <div class="card">
    <h2 class="card-title">🚀 Send Task</h2>
    
    <form @submit.prevent="handleSubmit" class="task-form">
      <div class="form-group">
        <label for="targetClient">Target Client</label>
        <select 
          id="targetClient" 
          v-model="form.client_id" 
          :disabled="loading || clientsLoading"
          required
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

      <div class="form-group">
        <label for="taskMode">Execution Mode</label>
        <select id="taskMode" v-model="form.mode" :disabled="loading">
          <option value="shell">🖥️ Shell Command</option>
          <option value="python">🐍 Python Script</option>
          <option value="file">📁 File Operation</option>
          <option value="custom">⚙️ Custom</option>
        </select>
      </div>

      <div class="form-group">
        <label for="taskPayload">{{ payloadLabel }}</label>
        <textarea 
          id="taskPayload" 
          v-model="form.payload" 
          :rows="payloadRows"
          :placeholder="payloadPlaceholder"
          :disabled="loading"
          required
        ></textarea>
      </div>

      <button 
        type="submit" 
        class="btn btn-primary btn-block" 
        :disabled="!isFormValid || loading"
      >
        <span v-if="loading" class="loading-spinner"></span>
        <span v-else class="send-icon">📤</span>
        {{ loading ? 'Sending Task...' : 'Send Task' }}
      </button>
    </form>

    <div v-if="lastSentTask" class="last-task">
      <div class="last-task-header">Last Sent Task:</div>
      <div class="last-task-id">{{ lastSentTask }}</div>
    </div>

    <div class="quick-actions">
      <h3>⚡ Quick Actions</h3>
      <div class="quick-buttons">
        <button 
          class="btn btn-quick" 
          @click="setQuickCommand('ls -la')"
          :disabled="loading"
        >
          📂 List Files
        </button>
        <button 
          class="btn btn-quick" 
          @click="setQuickCommand('ps aux')"
          :disabled="loading"
        >
          🔍 Show Processes
        </button>
        <button 
          class="btn btn-quick" 
          @click="setQuickCommand('df -h')"
          :disabled="loading"
        >
          💾 Disk Usage
        </button>
        <button 
          class="btn btn-quick" 
          @click="setQuickCommand('python3 --version')"
          :disabled="loading"
        >
          🐍 Python Version
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
        
        // Reset form
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

<style scoped>
.card {
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #667eea;
}

.task-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #e2e8f0;
  font-size: 14px;
}

input, select, textarea {
  width: 100%;
  padding: 14px 16px;
  background: rgba(45, 45, 68, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
  font-family: inherit;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(45, 45, 68, 1);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

textarea {
  resize: vertical;
  min-height: 100px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.btn-block {
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.send-icon {
  font-size: 16px;
}

.last-task {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
}

.last-task-header {
  font-size: 12px;
  color: #86efac;
  font-weight: 600;
  margin-bottom: 4px;
}

.last-task-id {
  font-family: monospace;
  color: #d1fae5;
  font-size: 14px;
}

.quick-actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-actions h3 {
  font-size: 16px;
  color: #667eea;
  margin-bottom: 16px;
  font-weight: 600;
}

.quick-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.btn-quick {
  background: rgba(102, 126, 234, 0.1);
  color: #a5b4fc;
  border: 1px solid rgba(102, 126, 234, 0.3);
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
}

.btn-quick:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.2);
  color: #c7d2fe;
  transform: translateY(-1px);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>