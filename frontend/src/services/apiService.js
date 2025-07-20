import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response.data
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const apiService = {
  // Participant endpoints
  registerParticipant: async (participantId, metadata = {}) => {
    return api.post('/participants', { metadata })
  },

  getParticipant: async (participantId) => {
    return api.get(`/participants/${participantId}`)
  },

  updateParticipant: async (participantId, updates) => {
    return api.put(`/participants/${participantId}`, updates)
  },

  // Interaction endpoints
  logInteraction: async (participantId, type, payload = {}) => {
    return api.post('/interactions', {
      participant_id: participantId,
      type,
      payload
    })
  },

  getInteraction: async (interactionId) => {
    return api.get(`/interactions/${interactionId}`)
  },

  getParticipantInteractions: async (participantId, options = {}) => {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page)
    if (options.limit) params.append('limit', options.limit)
    if (options.type) params.append('type', options.type)
    
    return api.get(`/interactions/participant/${participantId}?${params.toString()}`)
  },

  getAllInteractions: async (options = {}) => {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page)
    if (options.limit) params.append('limit', options.limit)
    if (options.type) params.append('type', options.type)
    if (options.participant_id) params.append('participant_id', options.participant_id)
    if (options.start_date) params.append('start_date', options.start_date)
    if (options.end_date) params.append('end_date', options.end_date)
    
    return api.get(`/interactions?${params.toString()}`)
  },

  updateInteraction: async (interactionId, updates) => {
    return api.put(`/interactions/${interactionId}`, updates)
  },

  // Health check
  healthCheck: async () => {
    return api.get('/health')
  },

  // Utility functions
  isOnline: async () => {
    try {
      await apiService.healthCheck()
      return true
    } catch (error) {
      return false
    }
  },

  // Batch operations
  logMultipleInteractions: async (participantId, interactions) => {
    const promises = interactions.map(({ type, payload }) =>
      apiService.logInteraction(participantId, type, payload)
    )
    return Promise.all(promises)
  },

  // Export functions
  exportParticipantData: async (participantId) => {
    const [participant, interactions] = await Promise.all([
      apiService.getParticipant(participantId),
      apiService.getParticipantInteractions(participantId, { limit: 1000 })
    ])

    return {
      participant,
      interactions: interactions.interactions,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
  }
}

export default apiService 