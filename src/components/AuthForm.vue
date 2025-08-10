<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">{{ isLoginMode ? 'Welcome Back' : 'Create Account' }}</h1>
        <p class="auth-subtitle">
          {{ isLoginMode ? 'Sign in to access your ZMQ dashboard' : 'Register to get your API key' }}
        </p>
      </div>

      <Transition name="fade">
        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
      </Transition>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            :disabled="loading"
            placeholder="Enter your email"
            required
            autocomplete="email"
          >
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            :disabled="loading"
            :placeholder="isLoginMode ? 'Enter your password' : 'Choose a strong password'"
            required
            autocomplete="current-password"
          >
        </div>

        <button 
          type="submit" 
          class="btn btn-primary btn-block" 
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? loadingText : submitButtonText }}
        </button>
      </form>

      <div class="auth-footer">
        <button 
          type="button"
          class="toggle-link" 
          @click="toggleMode" 
          :disabled="loading"
        >
          {{ toggleText }}
        </button>
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
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: radial-gradient(ellipse at top, #1e1b4b, #0f0f23);
}

.auth-card {
  background: rgba(26, 26, 46, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 48px;
  border-radius: 20px;
  box-shadow: 0 25px 80px rgba(0,0,0,0.5);
  width: 100%;
  max-width: 450px;
  position: relative;
  overflow: hidden;
}

.auth-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.auth-header {
  text-align: center;
  margin-bottom: 40px;
}

.auth-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-subtitle {
  color: #94a3b8;
  font-size: 16px;
}

.auth-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #e2e8f0;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 16px 20px;
  background: rgba(45, 45, 68, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(45, 45, 68, 1);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

input::placeholder {
  color: #64748b;
}

.btn {
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-block {
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.auth-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.toggle-link {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  transition: color 0.3s ease;
  padding: 8px;
}

.toggle-link:hover:not(:disabled) {
  color: #7c3aed;
}

.alert {
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 500;
}

.alert-error {
  background: rgba(127, 29, 29, 0.3);
  color: #fca5a5;
  border: 1px solid rgba(153, 27, 27, 0.5);
}

.alert-success {
  background: rgba(22, 101, 52, 0.3);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.5);
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

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .auth-card {
    padding: 32px 24px;
    margin: 16px;
  }
  
  .auth-title {
    font-size: 28px;
  }
}
</style>