import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ParticipantProvider } from './contexts/ParticipantContext'
import { SocketProvider } from './contexts/SocketContext'
import ParticipantExperience from './components/ParticipantExperience'
import QRCodePage from './components/QRCodePage'
import './styles/App.css'

function App() {
  return (
    <div className="App">
      <SocketProvider>
        <ParticipantProvider>
          <Routes>
            <Route path="/" element={<ParticipantExperience />} />
            <Route path="/qr" element={<QRCodePage />} />
          </Routes>
        </ParticipantProvider>
      </SocketProvider>
    </div>
  )
}

export default App 