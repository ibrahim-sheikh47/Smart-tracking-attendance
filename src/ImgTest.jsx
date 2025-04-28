import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { firestoreDb } from './config/firebase';

const QrCodeTest = () => {
  const [qrValue, setQrValue] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Generate a unique session ID when component mounts
    generateNewSession();
  }, []);

  const generateNewSession = async () => {
    // Create a unique session ID (timestamp + random string)
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setSessionId(newSessionId);

    // Create the QR data with session ID and timestamp
    const qrData = JSON.stringify({
      sessionId: newSessionId,
      timestamp: Date.now(),
      type: 'attendance'
    });

    setQrValue(qrData);

    // Save the session to Firestore
    try {
      await setDoc(doc(firestoreDb, "attendanceSessions", newSessionId), {
        createdAt: Timestamp.now(),
        active: true,
        attendees: []
      });
      console.log("New attendance session created:", newSessionId);
    } catch (error) {
      console.error("Error creating attendance session:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h2 className="text-xl font-bold mb-4">Smart Attendance QR Code</h2>
      <div className="bg-white p-4 rounded-lg shadow-md">
        {qrValue && (
          <QRCode
            value={qrValue}
            size={256}
            level="H" // High error correction level
          />
        )}
      </div>
      <p className="mt-4 text-gray-600">Session ID: {sessionId}</p>
      <button
        onClick={generateNewSession}
        className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Generate New QR Code
      </button>
      <p className="mt-4 text-sm text-gray-500">
        Scan this code with the attendance app to mark your presence
      </p>
    </div>
  );
};

export default QrCodeTest;