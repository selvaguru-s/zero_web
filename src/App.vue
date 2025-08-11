<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <header v-if="isAuthenticated" class="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">⚡</span>
            <h1 class="text-xl font-bold text-white">ZMQ Control Panel</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <div class="text-sm text-white opacity-90">{{ userInfo.email }}</div>
              <div class="text-xs" :class="userInfo.verified ? 'text-green-300' : 'text-yellow-300'">
                {{ userInfo.verified ? '✓ Verified' : '⚠ Unverified' }}
              </div>
            </div>
            <button 
              @click="handleLogout"
              class="px-4 py-2 text-sm font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Auth Form -->
    <AuthForm
      v-if="!isAuthenticated"
      @authenticated="handleAuthenticated"
      @error="handleError"
      @success="handleSuccess"
    />

    <!-- Dashboard -->
    <Dashboard
      v-if="isAuthenticated"
      :api-key="apiKey"
      :user-info="userInfo"
      @error="handleError"
      @success="handleSuccess"
    />

    <!-- Global Notifications -->
    <div class="fixed top-4 right-4 z-50">
      <Transition name="slide-down">
        <div 
          v-if="notification.message" 
          class="px-6 py-4 rounded-lg shadow-lg border min-w-80"
          :class="notificationClasses"
        >
          {{ notification.message }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase.js'
import api from './api.js'
import AuthForm from './components/AuthForm.vue'
import Dashboard from './components/Dashboard.vue'

export default {
  name: 'App',
  components: {
    AuthForm,
    Dashboard
  },
  setup() {
    const isAuthenticated = ref(false)
    const apiKey = ref('')
    const userInfo = ref({})
    const notification = ref({ message: '', type: '' })

    const notificationClasses = computed(() => {
      const base = 'font-medium'
      const types = {
        error: 'bg-red-900/80 text-red-200 border-red-700',
        success: 'bg-green-900/80 text-green-200 border-green-700', 
        info: 'bg-blue-900/80 text-blue-200 border-blue-700'
      }
      return `${base} ${types[notification.value.type] || types.info}`
    })

    const showNotification = (message, type = 'info') => {
      notification.value = { message, type }
      setTimeout(() => {
        notification.value = { message: '', type: '' }
      }, 5000)
    }

    const handleError = (message) => {
      showNotification(message, 'error')
    }

    const handleSuccess = (message) => {
      showNotification(message, 'success')
    }

    const handleAuthenticated = (authData) => {
      apiKey.value = authData.api_key
      userInfo.value = authData.user
      isAuthenticated.value = true
      api.setApiKey(authData.api_key)
      showNotification('Authentication successful!', 'success')
    }

    const handleLogout = async () => {
      try {
        await signOut(auth)
        isAuthenticated.value = false
        apiKey.value = ''
        userInfo.value = {}
        api.setApiKey(null)
        showNotification('Logged out successfully', 'success')
      } catch (error) {
        handleError('Failed to logout: ' + error.message)
      }
    }

    // Auto-login check
    onMounted(() => {
      onAuthStateChanged(auth, async (user) => {
        if (user && !isAuthenticated.value) {
          try {
            const idToken = await user.getIdToken()
            const authData = await api.login(idToken)
            handleAuthenticated(authData)
          } catch (error) {
            console.error('Auto-login failed:', error)
            handleError('Session expired. Please login again.')
          }
        }
      })
    })

    return {
      isAuthenticated,
      apiKey,
      userInfo,
      notification,
      notificationClasses,
      handleAuthenticated,
      handleLogout,
      handleError,
      handleSuccess
    }
  }
}
</script>

<style>
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>