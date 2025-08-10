<template>
  <div class="dashboard">
    <div class="dashboard-content">
      <div class="dashboard-grid">
        <!-- API Key Card -->
        <ApiKeyCard 
          :api-key="apiKey"
          @copied="$emit('success', 'API key copied to clipboard!')"
        />

        <!-- System Status Card -->
        <SystemStatusCard 
          @error="$emit('error', $event)"
        />

        <!-- Send Task Card -->
        <SendTaskCard 
          @error="$emit('error', $event)"
          @success="$emit('success', $event)"
          @task-sent="handleTaskSent"
        />

        <!-- Connected Clients Card -->
        <ClientsCard 
          @error="$emit('error', $event)"
          ref="clientsCard"
        />

        <!-- Recent Tasks Card -->
        <TasksCard 
          @error="$emit('error', $event)"
          ref="tasksCard"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import ApiKeyCard from './ApiKeyCard.vue'
import SystemStatusCard from './SystemStatusCard.vue'
import SendTaskCard from './SendTaskCard.vue'
import ClientsCard from './ClientsCard.vue'
import TasksCard from './TasksCard.vue'

export default {
  name: 'Dashboard',
  components: {
    ApiKeyCard,
    SystemStatusCard,
    SendTaskCard,
    ClientsCard,
    TasksCard
  },
  props: {
    apiKey: {
      type: String,
      required: true
    },
    userInfo: {
      type: Object,
      required: true
    }
  },
  emits: ['error', 'success'],
  setup(props, { emit }) {
    const clientsCard = ref(null)
    const tasksCard = ref(null)

    const handleTaskSent = () => {
      // Refresh clients and tasks when a task is sent
      setTimeout(() => {
        if (clientsCard.value) {
          clientsCard.value.fetchClients()
        }
        if (tasksCard.value) {
          tasksCard.value.fetchTasks()
        }
      }, 1000)
    }

    return {
      clientsCard,
      tasksCard,
      handleTaskSent
    }
  }
}
</script>

<style scoped>
.dashboard {
  min-height: calc(100vh - 80px);
}

.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  align-items: start;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-content {
    padding: 24px 16px;
  }
}
</style>