import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParticipant } from '../contexts/ParticipantContext'
import { useSocket } from '../contexts/SocketContext'
import { 
  Wifi, 
  WifiOff, 
  User, 
  Activity, 
  QrCode, 
  RefreshCw, 
  Settings,
  MessageCircle,
  Heart
} from 'lucide-react'
import './ParticipantExperience.css'

const ParticipantExperience = () => {
  const { 
    participantId, 
    isRegistered, 
    isLoading, 
    error, 
    metadata, 
    interactions,
    logInteraction,
    resetParticipant,
    getQRCodeData
  } = useParticipant()
  
  const { isConnected, connectionError, sendMessage, logInteractionViaSocket } = useSocket()
  
  const [currentView, setCurrentView] = useState('main')
  const [showQR, setShowQR] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [lastInteraction, setLastInteraction] = useState(null)

  // Log page visit interaction
  useEffect(() => {
    if (isRegistered && participantId) {
      logInteraction('system_event', {
        event: 'page_visit',
        page: 'participant_experience',
        timestamp: new Date().toISOString()
      })
    }
  }, [isRegistered, participantId, logInteraction])

  // Handle incoming messages and update last interaction
  useEffect(() => {
    if (interactions.length > 0) {
      setLastInteraction(interactions[0])
    }
  }, [interactions])

  const handleChoice = async (choice) => {
    await logInteraction('choice', {
      choice,
      timestamp: new Date().toISOString()
    })
    
    // Also log via socket for real-time updates
    logInteractionViaSocket('choice', {
      choice,
      timestamp: new Date().toISOString()
    })
  }

  const handleChapterVisit = async (chapterId) => {
    await logInteraction('chapter_visit', {
      chapterId,
      timestamp: new Date().toISOString()
    })
  }

  const handleConnectionEvent = async (connectionId, eventType) => {
    await logInteraction('connection_event', {
      connectionId,
      eventType,
      timestamp: new Date().toISOString()
    })
  }

  const handleSendMessage = (targetType, targetId, message) => {
    const success = sendMessage(targetType, targetId, message)
    if (success) {
      logInteraction('system_event', {
        event: 'message_sent',
        targetType,
        targetId,
        message
      })
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="loading-content"
        >
          <RefreshCw className="loading-spinner" />
          <h2>Connecting to Storyteller...</h2>
          <p>Initializing your experience</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-content"
        >
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button onClick={resetParticipant} className="retry-button">
            <RefreshCw size={16} />
            Retry
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="participant-experience">
      {/* Header */}
      <header className="experience-header">
        <div className="header-left">
          <h1>Storyteller</h1>
          <div className="connection-status">
            {isConnected ? (
              <Wifi className="status-icon connected" />
            ) : (
              <WifiOff className="status-icon disconnected" />
            )}
            <span className="status-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            onClick={() => setShowQR(!showQR)}
            className="icon-button"
            title="Show QR Code"
          >
            <QrCode size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="icon-button"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="experience-main">
        <AnimatePresence mode="wait">
          {currentView === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="main-content"
            >
              {/* Welcome Section */}
              <section className="welcome-section">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2>Welcome to Your Story</h2>
                  <p>Your journey begins here. Explore the chapters and connect with performers.</p>
                  
                  <div className="participant-info">
                    <User size={16} />
                    <span>ID: {participantId?.slice(0, 8)}...</span>
                  </div>
                </motion.div>
              </section>

              {/* Quick Actions */}
              <section className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-grid">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChoice('explore')}
                    className="action-button"
                  >
                    <Activity size={24} />
                    <span>Explore</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChoice('connect')}
                    className="action-button"
                  >
                    <MessageCircle size={24} />
                    <span>Connect</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChoice('discover')}
                    className="action-button"
                  >
                    <Heart size={24} />
                    <span>Discover</span>
                  </motion.button>
                </div>
              </section>

              {/* Recent Activity */}
              {interactions.length > 0 && (
                <section className="recent-activity">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    {interactions.slice(0, 5).map((interaction, index) => (
                      <motion.div
                        key={interaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="activity-item"
                      >
                        <div className="activity-icon">
                          {interaction.type === 'choice' && <Activity size={16} />}
                          {interaction.type === 'chapter_visit' && <User size={16} />}
                          {interaction.type === 'connection_event' && <MessageCircle size={16} />}
                          {interaction.type === 'system_event' && <Settings size={16} />}
                        </div>
                        <div className="activity-content">
                          <span className="activity-type">{interaction.type}</span>
                          <span className="activity-time">
                            {new Date(interaction.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Your QR Code</h3>
              <p>Scan this code to continue your story on another device</p>
              <div className="qr-container">
                {/* QR Code will be rendered here */}
                <div className="qr-placeholder">
                  <QrCode size={64} />
                  <p>QR Code: {getQRCodeData()}</p>
                </div>
              </div>
              <button onClick={() => setShowQR(false)} className="close-button">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Settings</h3>
              <div className="settings-content">
                <div className="setting-item">
                  <label>Participant ID:</label>
                  <span className="setting-value">{participantId}</span>
                </div>
                <div className="setting-item">
                  <label>Connection Status:</label>
                  <span className={`setting-value ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="setting-item">
                  <label>Total Interactions:</label>
                  <span className="setting-value">{interactions.length}</span>
                </div>
              </div>
              <div className="settings-actions">
                <button onClick={resetParticipant} className="danger-button">
                  Reset Participant
                </button>
                <button onClick={() => setShowSettings(false)} className="close-button">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Error Banner */}
      {connectionError && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-banner"
        >
          <WifiOff size={16} />
          <span>{connectionError}</span>
        </motion.div>
      )}
    </div>
  )
}

export default ParticipantExperience 