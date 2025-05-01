import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const QrCodeDialog = ({ open, onClose, employee }) => {
  const handleDownload = () => {
    if (!employee?.qrCodeUrl) return;

    // Create a temporary anchor element to download the QR code
    const link = document.createElement('a');
    link.href = employee.qrCodeUrl;
    link.download = `qr-code-${employee.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{employee?.name}</DialogTitle>
      <DialogContent>
        {employee?.qrCodeUrl ? (
          <img
            src={employee.qrCodeUrl}
            alt={`${employee.name}'s QR Code`}
            style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
          />
        ) : (
          <Typography variant="body1" color="textSecondary">
            No QR code available for this employee.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
        {employee?.qrCodeUrl && (
          <Button onClick={handleDownload} color="primary">
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QrCodeDialog;