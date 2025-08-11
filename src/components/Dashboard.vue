<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
          @success="$emit('success', $event)"
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