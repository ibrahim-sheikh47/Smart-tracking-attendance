"use client"

import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import { Modal, Box, Typography, Button } from "@mui/material"
import { saveAs } from "file-saver"
import { firestoreDb } from "../config/firebase.jsx"
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const QRCodeGenerator = () => {
  const [qrValue, setQrValue] = useState("")
  const [isGenerated, setIsGenerated] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [sessionId, setSessionId] = useState("")
  // eslint-disable-next-line no-unused-vars
  const [expiryTime, setExpiryTime] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Get the current admin user when component mounts
  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      try {
        const auth = getAuth()
        const user = auth.currentUser

        if (user) {
          // Get the admin document
          const adminDoc = await getDoc(doc(firestoreDb, "admins", user.uid))
          if (adminDoc.exists()) {
            setCurrentAdmin({ id: adminDoc.id, ...adminDoc.data() })
          } else {
            console.error("Admin document not found")
            setError("Admin account not found. Please contact support.")
          }
        } else {
          setError("You must be logged in as an admin to generate QR codes.")
        }
      } catch (error) {
        console.error("Error fetching admin data:", error)
        setError("Failed to load admin data. Please try again.")
      }
    }

    fetchCurrentAdmin()
  }, [])

  // Generate a unique QR code value with timestamp, session ID, and admin ID
  const generateQRCode = async () => {
    if (!currentAdmin) {
      setError("Admin authentication required to generate QR codes")
      return
    }

    try {
      setLoading(true)
      // Generate a unique session ID
      const newSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      setSessionId(newSessionId)

      // Set expiry time (30 minutes from now)
      const expiry = new Date(Date.now() + 30 * 60000)
      setExpiryTime(expiry)
      setCountdown(1800) // 30 minutes in seconds

      // Create QR code data with session information and admin ID
      const qrData = JSON.stringify({
        sessionId: newSessionId,
        timestamp: new Date().toISOString(),
        type: "attendance",
        expiry: expiry.toISOString(),
        adminId: currentAdmin.id, // Include the admin ID in the QR code
      })

      setQrValue(qrData)
      setIsGenerated(true)

      // Store session information in Firestore for tracking
      await addDoc(collection(firestoreDb, "AttendanceSessions"), {
        sessionId: newSessionId,
        createdAt: serverTimestamp(),
        expiresAt: expiry,
        active: true,
        adminId: currentAdmin.id, // Store the admin ID with the session
        adminName: currentAdmin.name || "Admin", // Store admin name for reference
      })

      // Open modal automatically when QR is generated
      setOpenModal(true)
      setError(null)
    } catch (error) {
      console.error("Error generating QR code:", error)
      setError("Failed to generate QR code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Countdown timer for QR code expiry
  useEffect(() => {
    let timer
    if (countdown > 0 && openModal) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0 && isGenerated) {
      // QR code expired, generate a new one
      setIsGenerated(false)
    }

    return () => clearInterval(timer)
  }, [countdown, openModal, isGenerated])

  // Format countdown time as MM:SS
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60)
    const seconds = countdown % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
  }

  const downloadQRCode = () => {
    // Create a canvas from the QR code
    const canvas = document.getElementById("qr-canvas")
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `attendance-qr-${new Date().toISOString()}.png`)
      }
    })
  }

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  }

  return (
    <div className="mt-6">
      {error && <div className="text-red-500 mb-2">{error}</div>}

      {!isGenerated ? (
        <Button
          variant="contained"
          color="primary"
          onClick={generateQRCode}
          style={{ backgroundColor: "#4CAF50" }}
          disabled={loading || !currentAdmin}
        >
          {loading ? "Generating..." : "Generate QR Code"}
        </Button>
      ) : (
        <div className="flex gap-4">
          <Button
            variant="contained"
            color="primary"
            onClick={generateQRCode}
            style={{ backgroundColor: "#4CAF50" }}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate New"}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenModal}
            style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
          >
            See QR Code
          </Button>
        </div>
      )}

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="qr-code-modal"
        aria-describedby="attendance-qr-code"
      >
        <Box sx={modalStyle}>
          <Typography id="qr-code-modal" variant="h6" component="h2">
            Attendance QR Code
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Scan this QR code with the mobile app to mark attendance
          </Typography>

          {currentAdmin && (
            <Typography variant="body2" color="text.secondary">
              Admin: {currentAdmin.name || currentAdmin.id}
            </Typography>
          )}

          <Typography variant="body1" color="primary" sx={{ fontWeight: "bold" }}>
            Expires in: {formatCountdown()}
          </Typography>

          <div style={{ background: "white", padding: "16px", marginBottom: "16px" }}>
            <QRCode id="qr-canvas" value={qrValue} size={256} level="H" />
          </div>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Session ID: {sessionId.substring(0, 8)}...
          </Typography>

          <Button variant="contained" color="primary" onClick={downloadQRCode} style={{ backgroundColor: "#4CAF50" }}>
            Download QR Code
          </Button>
        </Box>
      </Modal>
    </div>
  )
}

export default QRCodeGenerator
