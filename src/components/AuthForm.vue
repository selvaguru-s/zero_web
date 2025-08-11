<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-gray-900 to-gray-900">
    <div class="w-full max-w-md">
      <div class="bg-gray-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <!-- Animated border -->
        <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
        
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {{ isLoginMode ? 'Welcome Back' : 'Create Account' }}
          </h1>
          <p class="text-gray-400 mt-2">
            {{ isLoginMode ? 'Sign in to access your ZMQ dashboard' : 'Register to get your API key' }}
          </p>
        </div>

        <!-- Alerts -->
        <Transition name="fade">
          <div v-if="errorMessage" class="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
            {{ errorMessage }}
          </div>
        </Transition>

        <Transition name="fade">
          <div v-if="successMessage" class="mb-6 p-4 bg-green-900/30 border border-green-700/50 rounded-lg text-green-200">
            {{ successMessage }}
          </div>
        </Transition>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-200 mb-2">
              Email Address
            </label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              :disabled="loading"
              placeholder="Enter your email"
              required
              class="w-full px-4 py-3 bg-gray-700/80 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-200 mb-2">
              Password
            </label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              :disabled="loading"
              :placeholder="isLoginMode ? 'Enter your password' : 'Choose a strong password (min 6 chars)'"
              required
              class="w-full px-4 py-3 bg-gray-700/80 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
          </div>

          <button 
            type="submit" 
            :disabled="loading || !isFormValid"
            class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <div v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{{ loading ? loadingText : submitButtonText }}</span>
          </button>
        </form>

        <!-- Toggle Mode -->
        <div class="mt-6 text-center border-t border-white/10 pt-6">
          <button 
            type="button"
            @click="toggleMode" 
            :disabled="loading"
            class="text-indigo-400 hover:text-indigo-300 text-sm font-medium underline transition-colors disabled:opacity-50"
          >
            {{ toggleText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { auth } from '../firebase.js'
import api from '../api.js'

export default {
  name: 'AuthForm',
  emits: ['authenticated', 'error', 'success'],
  setup(props, { emit }) {
    const isLoginMode = ref(true)
    const loading = ref(false)
    const email = ref('')
    const password = ref('')
    const errorMessage = ref('')
    const successMessage = ref('')

    const loadingText = computed(() => 
      isLoginMode.value ? 'Signing in...' : 'Creating account...'
    )

    const submitButtonText = computed(() =>
      isLoginMode.value ? 'Sign In' : 'Create Account'
    )

    const toggleText = computed(() =>
      isLoginMode.value 
        ? "Don't have an account? Sign up" 
        : "Already have an account? Sign in"
    )

    const isFormValid = computed(() =>
      email.value.length > 0 && password.value.length >= 6
    )

    const clearMessages = () => {
      errorMessage.value = ''
      successMessage.value = ''
    }

    const showError = (message) => {
      errorMessage.value = message
      successMessage.value = ''
      emit('error', message)
    }

    const showSuccess = (message) => {
      successMessage.value = message
      errorMessage.value = ''
      emit('success', message)
    }

    const getErrorMessage = (error) => {
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters long.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.'
      }
      
      return errorMessages[error.code] || error.message || 'Authentication failed. Please try again.'
    }

    const toggleMode = () => {
      isLoginMode.value = !isLoginMode.value
      clearMessages()
    }

    const handleSubmit = async () => {
      loading.value = true
      clearMessages()

      try {
        let userCredential

        if (isLoginMode.value) {
          userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
        } else {
          userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
          
          // Send email verification
          await sendEmailVerification(userCredential.user)
          showSuccess('Registration successful! Please check your email for verification.')
        }

        // Get ID token and authenticate with backend
        const idToken = await userCredential.user.getIdToken()
        const authData = await api.login(idToken)
        
        emit('authenticated', authData)

      } catch (error) {
        console.error('Auth error:', error)
        showError(getErrorMessage(error))
      } finally {
        loading.value = false
      }
    }

    return {
      isLoginMode,
      loading,
      email,
      password,
      errorMessage,
      successMessage,
      loadingText,
      submitButtonText,
      toggleText,
      isFormValid,
      toggleMode,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>