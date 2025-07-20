import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useParticipant } from './ParticipantContext'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const { participantId, isRegistered, logInteraction } = useParticipant()

  useEffect(() => {
    if (!isRegistered || !participantId) return

    // Initialize socket connection
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to Storyteller server')
      setIsConnected(true)
      setConnectionError(null)
      
      // Join as participant
      socket.emit('participant:join', {
        participantId,
        metadata: {
          userAgent: navigator.userAgent,
          screenSize: `${window.screen.width}x${window.screen.height}`,
          timestamp: new Date().toISOString()
        }
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Storyteller server:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setConnectionError('Failed to connect to server')
      setIsConnected(false)
    })

    // Participant events
    socket.on('participant:joined', (data) => {
      console.log('Participant joined:', data)
      logInteraction('system_event', {
        event: 'websocket_connected',
        socketId: data.socketId
      })
    })

    // Interaction events
    socket.on('interaction:logged', (data) => {
      console.log('Interaction logged:', data)
    })

    // Message events
    socket.on('message:received', (data) => {
      console.log('Message received:', data)
      // Handle incoming messages from chapters/connections
      handleIncomingMessage(data)
    })

    // Chapter events
    socket.on('chapter:registered', (data) => {
      console.log('Chapter registered:', data)
    })

    socket.on('chapter:updated', (data) => {
      console.log('Chapter updated:', data)
    })

    socket.on('chapter:offline', (data) => {
      console.log('Chapter offline:', data)
    })

    // Connection events
    socket.on('connection:registered', (data) => {
      console.log('Connection registered:', data)
    })

    socket.on('connection:updated', (data) => {
      console.log('Connection updated:', data)
    })

    socket.on('connection:offline', (data) => {
      console.log('Connection offline:', data)
    })

    // Heartbeat
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat')
      }
    }, 30000) // 30 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval)
      if (socket) {
        socket.disconnect()
      }
    }
  }, [isRegistered, participantId, logInteraction])

  const handleIncomingMessage = (data) => {
    const { message, payload } = data
    
    // Log the incoming message as an interaction
    logInteraction('system_event', {
      event: 'message_received',
      message,
      payload,
      from: data.from
    })

    // Handle different message types
    switch (message) {
      case 'chapter_trigger':
        handleChapterTrigger(payload)
        break
      case 'connection_interaction':
        handleConnectionInteraction(payload)
        break
      case 'story_update':
        handleStoryUpdate(payload)
        break
      default:
        console.log('Unknown message type:', message)
    }
  }

  const handleChapterTrigger = (payload) => {
    // Handle chapter-specific triggers
    console.log('Chapter trigger received:', payload)
    
    // Example: Trigger visual effects, sounds, etc.
    if (payload.effect) {
      // Trigger effect based on payload
      console.log('Triggering effect:', payload.effect)
    }
  }

  const handleConnectionInteraction = (payload) => {
    // Handle connection agent interactions
    console.log('Connection interaction received:', payload)
    
    // Example: Show connection-specific content
    if (payload.content) {
      // Display content from connection agent
      console.log('Connection content:', payload.content)
    }
  }

  const handleStoryUpdate = (payload) => {
    // Handle story progression updates
    console.log('Story update received:', payload)
    
    // Example: Update story state, show new content
    if (payload.storyState) {
      // Update story state
      console.log('Story state update:', payload.storyState)
    }
  }

  const sendMessage = (targetType, targetId, message, payload = {}) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error('Socket not connected')
      return false
    }

    socketRef.current.emit('message:send', {
      targetType,
      targetId,
      message,
      payload
    })

    return true
  }

  const logInteractionViaSocket = (type, payload = {}) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error('Socket not connected')
      return false
    }

    socketRef.current.emit('interaction:log', {
      participantId,
      type,
      payload
    })

    return true
  }

  const value = {
    isConnected,
    connectionError,
    sendMessage,
    logInteractionViaSocket,
    socket: socketRef.current
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
} 