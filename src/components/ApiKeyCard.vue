<template>
  <div class="card">
    <h2 class="card-title">🔑 Your API Key</h2>
    
    <div class="alert alert-info">
      Use this key to authenticate your ZMQ clients
    </div>

    <div class="api-key-section">
      <div class="api-key-display">
        <code>{{ apiKey }}</code>
      </div>
      
      <button 
        class="btn btn-success btn-block" 
        @click="copyToClipboard"
        :disabled="copyButtonText !== 'Copy API Key'"
      >
        <span class="copy-icon">{{ copyIcon }}</span>
        {{ copyButtonText }}
      </button>
    </div>

    <div class="instructions">
      <h3>💡 Usage Instructions</h3>
      <ol>
        <li>Copy your API key using the button above</li>
        <li>Add it to your client application configuration</li>
        <li>Include it in the <code>"api_key"</code> field when connecting</li>
        <li>Your clients will authenticate automatically</li>
      </ol>
    </div>

    <div class="security-note">
      <strong>🔒 Security Note:</strong> Keep this API key secure and don't share it publicly. 
      It provides access to your ZMQ server resources.
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ApiKeyCard',
  props: {
    apiKey: {
      type: String,
      required: true
    }
  },
  emits: ['copied'],
  setup(props, { emit }) {
    const copyButtonText = ref('Copy API Key')
    const copied = ref(false)

    const copyIcon = computed(() => 
      copied.value ? '✅' : '📋'
    )

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(props.apiKey)
        copyButtonText.value = 'Copied!'
        copied.value = true
        emit('copied')
        
        setTimeout(() => {
          copyButtonText.value = 'Copy API Key'
          copied.value = false
        }, 2000)
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = props.apiKey
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        
        copyButtonText.value = 'Copied!'
        copied.value = true
        emit('copied')
        
        setTimeout(() => {
          copyButtonText.value = 'Copy API Key'
          copied.value = false
        }, 2000)
      }
    }

    return {
      copyButtonText,
      copyIcon,
      copyToClipboard
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
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-key-section {
  margin: 24px 0;
}

.api-key-display {
  background: rgba(45, 45, 68, 0.8);
  border: 2px dashed rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
}

.api-key-display code {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
  color: #e2e8f0;
  display: block;
}

.btn {
  padding: 14px 28px;
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

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4);
}

.btn-block {
  width: 100%;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

.copy-icon {
  font-size: 16px;
}

.instructions {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
}

.instructions h3 {
  color: #667eea;
  font-size: 16px;
  margin-bottom: 12px;
  font-weight: 600;
}

.instructions ol {
  color: #e2e8f0;
  padding-left: 20px;
  line-height: 1.6;
}

.instructions li {
  margin-bottom: 8px;
}

.instructions code {
  background: rgba(45, 45, 68, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.security-note {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
  color: #fca5a5;
  line-height: 1.5;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}

.alert-info {
  background: rgba(30, 58, 138, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
</style>