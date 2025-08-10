// API client for ZMQ server backend

class ApiClient {
  constructor() {
    this.baseURL = '/api'
    this.apiKey = null
  }

  setApiKey(key) {
    this.apiKey = key
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Authentication endpoints
  async login(idToken) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    })
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' })
  }

  async verifyApiKey(apiKey) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey })
    })
  }

  // Data endpoints
  async getClients() {
    return this.request('/clients')
  }

  async getTasks() {
    return this.request('/tasks')
  }

  async sendTask(clientId, mode, payload) {
    return this.request('/send', {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        mode,
        payload
      })
    })
  }

  async getClientLogs(clientId, limit = 100) {
    return this.request(`/client/${clientId}/logs?limit=${limit}`)
  }

  async getSystemStatus() {
    return this.request('/status')
  }
}

export default new ApiClient()