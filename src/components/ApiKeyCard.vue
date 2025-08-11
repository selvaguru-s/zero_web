<template>
  <div class="bg-gradient-to-br from-gray-800 to-gray-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
    <h2 class="text-xl font-bold text-indigo-400 mb-4 flex items-center space-x-2">
      <span>🔑</span>
      <span>Your API Key</span>
    </h2>
    
    <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-6 text-blue-200 text-sm">
      Use this key to authenticate your ZMQ clients
    </div>

    <div class="space-y-4">
      <div class="bg-gray-700/50 border-2 border-dashed border-indigo-500/30 rounded-xl p-4">
        <code class="text-gray-200 text-sm font-mono break-all block leading-relaxed">
          {{ apiKey }}
        </code>
      </div>
      
      <button 
        @click="copyToClipboard"
        :disabled="copyButtonText !== 'Copy API Key'"
        class="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <span>{{ copyIcon }}</span>
        <span>{{ copyButtonText }}</span>
      </button>
    </div>

    <div class="mt-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
      <h3 class="text-indigo-400 font-semibold mb-3 flex items-center space-x-2">
        <span>💡</span>
        <span>Usage Instructions</span>
      </h3>
      <ol class="text-gray-300 text-sm space-y-2 pl-4">
        <li class="list-decimal">Copy your API key using the button above</li>
        <li class="list-decimal">Add it to your client application configuration</li>
        <li class="list-decimal">Include it in the <code class="bg-gray-700 px-1 rounded text-xs">"api_key"</code> field when connecting</li>
        <li class="list-decimal">Your clients will authenticate automatically</li>
      </ol>
    </div>

    <div class="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-xs">
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