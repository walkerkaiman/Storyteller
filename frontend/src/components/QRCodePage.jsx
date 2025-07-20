import React, { useEffect, useRef } from 'react'
import { useParticipant } from '../contexts/ParticipantContext'
import { QrCode, Copy, Download, ArrowLeft } from 'lucide-react'
import QRCode from 'qrcode'
import './QRCodePage.css'

const QRCodePage = () => {
  const { participantId, getQRCodeData } = useParticipant()
  const canvasRef = useRef(null)
  const qrData = getQRCodeData()

  useEffect(() => {
    if (qrData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    }
  }, [qrData])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData)
      // You could add a toast notification here
      console.log('QR code data copied to clipboard')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.download = `storyteller-qr-${participantId?.slice(0, 8)}.png`
      link.href = canvasRef.current.toDataURL()
      link.click()
    }
  }

  const goBack = () => {
    window.history.back()
  }

  if (!participantId) {
    return (
      <div className="qr-page-error">
        <h2>No Participant ID</h2>
        <p>Please return to the main page to initialize your participant ID.</p>
        <button onClick={goBack} className="back-button">
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="qr-page">
      <header className="qr-header">
        <button onClick={goBack} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Your Storyteller QR Code</h1>
      </header>

      <main className="qr-content">
        <div className="qr-section">
          <h2>Continue Your Story</h2>
          <p>Scan this QR code with another device to continue your interactive experience.</p>
          
          <div className="qr-display">
            <canvas ref={canvasRef} className="qr-canvas" />
          </div>

          <div className="qr-actions">
            <button onClick={copyToClipboard} className="action-button">
              <Copy size={16} />
              Copy Link
            </button>
            <button onClick={downloadQRCode} className="action-button">
              <Download size={16} />
              Download QR
            </button>
          </div>
        </div>

        <div className="participant-info-section">
          <h3>Your Participant Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Participant ID:</label>
              <span className="participant-id">{participantId}</span>
            </div>
            <div className="info-item">
              <label>Shareable Link:</label>
              <span className="shareable-link">{qrData}</span>
            </div>
          </div>
        </div>

        <div className="instructions-section">
          <h3>How to Use</h3>
          <div className="instructions-list">
            <div className="instruction-item">
              <div className="instruction-number">1</div>
              <div className="instruction-content">
                <h4>Scan the QR Code</h4>
                <p>Use your phone's camera or a QR code scanner app to scan this code.</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-number">2</div>
              <div className="instruction-content">
                <h4>Open the Link</h4>
                <p>The scanner will open the Storyteller experience in your browser.</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-number">3</div>
              <div className="instruction-content">
                <h4>Continue Your Story</h4>
                <p>Your progress and interactions will be synchronized across devices.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default QRCodePage 