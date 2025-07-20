import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const ParticipantQRCode = ({ userId }) => {
  if (!userId) return <div>Loading your QR code...</div>;

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Your Check-In QR Code</h2>
      <QRCodeCanvas value={userId} size={256} includeMargin={true} />
      <p style={{ marginTop: '1rem' }}>Show this QR code at the installation to check in.</p>
    </div>
  );
};

export default ParticipantQRCode; 