<template>
  <div class="app">
    <!-- Header -->
    <header v-if="isAuthenticated" class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">⚡</span>
          ZMQ Control Panel
        </div>
        <div class="user-menu">
          <div class="user-info">
            <span class="user-email">{{ userInfo.email }}</span>
            <span 
              class="verification-status"
              :class="{ 'verified': userInfo.verified }"
            >
              {{ userInfo.verified ? '✓ Verified' : '⚠ Unverified' }}
            </span>
          </div>
          <button class="btn btn-outline" @click="handleLogout">
            Logout
          </button>
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
    <div class="notifications">
      <Transition name="slide-down">
        <div v-if="notification.message" class="notification" :class="notification.type">
          {{ notification.message }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
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
      handleAuthenticated,
      handleLogout,
      handleError,
      handleSuccess
    }
  }
}
</script>

<style>
.app {
  min-height: 100vh;
  background: #0f0f23;
  color: #fff;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.logo-icon {
  font-size: 24px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.user-email {
  font-size: 14px;
  opacity: 0.9;
}

.verification-status {
  font-size: 12px;
  opacity: 0.8;
}

.verification-status.verified {
  color: #86efac;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
}

.btn-outline:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.5);
}

.notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.notification {
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  font-weight: 500;
  min-width: 300px;
}

.notification.error {
  background: #7f1d1d;
  color: #fca5a5;
  border: 1px solid #991b1b;
}

.notification.success {
  background: #166534;
  color: #86efac;
  border: 1px solid #22c55e;
}

.notification.info {
  background: #1e40af;
  color: #93c5fd;
  border: 1px solid #3b82f6;
}

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

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .user-info {
    align-items: center;
  }
}
</style>