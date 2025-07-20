import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { apiService } from '../services/apiService'

const ParticipantContext = createContext()

const initialState = {
  participantId: null,
  isRegistered: false,
  isLoading: true,
  error: null,
  metadata: {},
  interactions: []
}

const participantReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SET_PARTICIPANT':
      return { 
        ...state, 
        participantId: action.payload.id,
        isRegistered: true,
        isLoading: false,
        error: null,
        metadata: action.payload.metadata || {}
      }
    case 'UPDATE_METADATA':
      return { ...state, metadata: { ...state.metadata, ...action.payload } }
    case 'ADD_INTERACTION':
      return { 
        ...state, 
        interactions: [action.payload, ...state.interactions]
      }
    case 'SET_INTERACTIONS':
      return { ...state, interactions: action.payload }
    default:
      return state
  }
}

export const ParticipantProvider = ({ children }) => {
  const [state, dispatch] = useReducer(participantReducer, initialState)

  // Initialize participant on mount
  useEffect(() => {
    initializeParticipant()
  }, [])

  const initializeParticipant = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Check localStorage for existing participant ID
      let participantId = localStorage.getItem('storyteller_participant_id')
      
      if (!participantId) {
        // Generate new participant ID
        participantId = uuidv4()
        localStorage.setItem('storyteller_participant_id', participantId)
        
        // Register new participant with backend
        const response = await apiService.registerParticipant(participantId)
        dispatch({ type: 'SET_PARTICIPANT', payload: response })
      } else {
        // Fetch existing participant data
        try {
          const response = await apiService.getParticipant(participantId)
          dispatch({ type: 'SET_PARTICIPANT', payload: response })
        } catch (error) {
          // If participant not found, create new one
          if (error.response?.status === 404) {
            localStorage.removeItem('storyteller_participant_id')
            await initializeParticipant()
            return
          }
          throw error
        }
      }
      
      // Load participant interactions
      await loadInteractions(participantId)
      
    } catch (error) {
      console.error('Failed to initialize participant:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize participant' })
    }
  }

  const loadInteractions = async (participantId) => {
    try {
      const response = await apiService.getParticipantInteractions(participantId)
      dispatch({ type: 'SET_INTERACTIONS', payload: response.interactions })
    } catch (error) {
      console.error('Failed to load interactions:', error)
    }
  }

  const updateMetadata = async (metadata) => {
    try {
      if (!state.participantId) return
      
      await apiService.updateParticipant(state.participantId, { metadata })
      dispatch({ type: 'UPDATE_METADATA', payload: metadata })
    } catch (error) {
      console.error('Failed to update metadata:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update metadata' })
    }
  }

  const logInteraction = async (type, payload = {}) => {
    try {
      if (!state.participantId) return
      
      const interaction = await apiService.logInteraction(state.participantId, type, payload)
      dispatch({ type: 'ADD_INTERACTION', payload: interaction })
      return interaction
    } catch (error) {
      console.error('Failed to log interaction:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to log interaction' })
    }
  }

  const resetParticipant = async () => {
    try {
      localStorage.removeItem('storyteller_participant_id')
      dispatch({ type: 'SET_LOADING', payload: true })
      await initializeParticipant()
    } catch (error) {
      console.error('Failed to reset participant:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reset participant' })
    }
  }

  const getParticipantId = () => state.participantId

  const getQRCodeData = () => {
    if (!state.participantId) return null
    
    // Create a shareable URL with participant ID
    const baseUrl = window.location.origin
    return `${baseUrl}?participant=${state.participantId}`
  }

  const value = {
    ...state,
    updateMetadata,
    logInteraction,
    resetParticipant,
    getParticipantId,
    getQRCodeData
  }

  return (
    <ParticipantContext.Provider value={value}>
      {children}
    </ParticipantContext.Provider>
  )
}

export const useParticipant = () => {
  const context = useContext(ParticipantContext)
  if (!context) {
    throw new Error('useParticipant must be used within a ParticipantProvider')
  }
  return context
} 