"use client"

import { useState } from "react"
import { Dialog, DialogContent, Box, Typography, IconButton, Grid, Paper } from "@mui/material"
import {
  Close as CloseIcon,
  Link as LinkIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Image as ImageIcon,
} from "@mui/icons-material"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import html2canvas from "html2canvas"

const ExportModal = ({ open, onClose, data, title = "Payroll Data" }) => {
  const [loading, setLoading] = useState(false)

  const exportOptions = [
    {
      id: "link",
      label: "Share Link",
      icon: <LinkIcon sx={{ fontSize: 40, color: "#666" }} />,
      bgColor: "#f5f5f5",
      borderColor: "#ddd",
    },
    {
      id: "pdf",
      label: "Share PDF",
      icon: <PdfIcon sx={{ fontSize: 40, color: "#fff" }} />,
      bgColor: "#dc3545",
      borderColor: "#dc3545",
    },
    {
      id: "excel",
      label: "Share EXCEL",
      icon: <ExcelIcon sx={{ fontSize: 40, color: "#fff" }} />,
      bgColor: "#28a745",
      borderColor: "#28a745",
    },
    {
      id: "jpeg1",
      label: "Share JPG",
      icon: <ImageIcon sx={{ fontSize: 40, color: "#fff" }} />,
      bgColor: "#6f42c1",
      borderColor: "#6f42c1",
    },
    {
      id: "jpeg2",
      label: "Share JPG",
      icon: <PdfIcon sx={{ fontSize: 40, color: "#fff" }} />,
      bgColor: "#dc3545",
      borderColor: "#dc3545",
    },
  ]

  const handleExport = async (type) => {
    setLoading(true)
    try {
      switch (type) {
        case "link":
          await handleShareLink()
          break
        case "pdf":
          await handlePDFExport()
          break
        case "excel":
          await handleExcelExport()
          break
        case "jpeg1":
        case "jpeg2":
          await handleImageExport()
          break
        default:
          console.log("Export type not implemented:", type)
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleShareLink = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        })
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url)
      alert("Link copied to clipboard!")
    }
    onClose()
  }

  const handlePDFExport = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.text(title, 20, 20)

    // Add date
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35)

    if (data && data.length > 0) {
      // Prepare table data - adapt columns based on data structure
      let tableColumns = []
      let tableRows = []

      // Check data structure to determine columns
      if (data[0].name && data[0].totalPay) {
        // Payroll data
        tableColumns = ["Name", "Department", "Total Pay", "Regular Pay", "Overtime"]
        tableRows = data.map((item) => [
          item.name || "N/A",
          item.department || "N/A",
          item.totalPay || "D0.00",
          item.comp || "D0.00",
          item.overtime || "None",
        ])
      } else if (data[0].formattedDate && data[0].checkInTime) {
        // Attendance history data
        tableColumns = ["Date", "Check-in", "Check-out", "Working Hours", "Status"]
        tableRows = data.map((item) => [
          item.formattedDate || "N/A",
          item.checkInTime || "N/A",
          item.checkOutTime || "N/A",
          item.workingHours || "N/A",
          item.status || "N/A",
        ])
      } else if (data[0].present !== undefined) {
        // Reports data
        tableColumns = ["Name", "Department", "Present", "Absents", "Overtime", "Working Hours"]
        tableRows = data.map((item) => [
          item.name || "N/A",
          item.department || "N/A",
          item.present || 0,
          item.absents || 0,
          item.overtime || "0 hours",
          item.workingHours || "0 hours",
        ])
      } else if (typeof data === "object" && !Array.isArray(data)) {
        // Single employee detail
        tableColumns = ["Field", "Value"]
        tableRows = Object.entries(data)
          .filter(([key]) => !key.includes("Details") && key !== "avatar" && key !== "id" && key !== "adminId")
          .map(([key, value]) => [
            key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
            value || "N/A",
          ])
      }

      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 50,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [61, 194, 150],
          textColor: 255,
        },
      })
    }

    // Save the PDF
    doc.save(`${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`)
    onClose()
  }

  const handleExcelExport = () => {
    if (!data) {
      alert("No data to export")
      return
    }

    // Prepare data for Excel
    let excelData = []

    if (Array.isArray(data) && data.length > 0) {
      if (data[0].name && data[0].totalPay) {
        // Payroll data
        excelData = data.map((employee) => ({
          "Employee Name": employee.name || "N/A",
          Department: employee.department || "N/A",
          Email: employee.email || "N/A",
          Phone: employee.phoneNumber || "N/A",
          "Hourly Rate": employee.comp || "D0.00",
          "Working Hours": employee.hours || "0 hours",
          Overtime: employee.overtime || "None",
          "Total Pay": employee.totalPay || "D0.00",
          "Total Working Time": employee.totalWorkingTime || "0 hours",
        }))
      } else if (data[0].formattedDate && data[0].checkInTime) {
        // Attendance history data
        excelData = data.map((record) => ({
          Date: record.formattedDate || "N/A",
          "Check-in Time": record.checkInTime || "N/A",
          "Check-out Time": record.checkOutTime || "N/A",
          "Working Hours": record.workingHours || "N/A",
          Status: record.status || "N/A",
        }))
      } else if (data[0].present !== undefined) {
        // Reports data
        excelData = data.map((employee) => ({
          "Employee Name": employee.name || "N/A",
          Department: employee.department || "N/A",
          Designation: employee.designation || "N/A",
          Email: employee.email || "N/A",
          Phone: employee.phoneNumber || "N/A",
          "Present Days": employee.present || 0,
          "Absent Days": employee.absents || 0,
          Overtime: employee.overtime || "0 hours",
          "Working Hours": employee.workingHours || "0 hours",
        }))
      }
    } else if (typeof data === "object" && !Array.isArray(data)) {
      // Single employee detail
      excelData = [
        Object.entries(data)
          .filter(([key]) => !key.includes("Details") && key !== "avatar" && key !== "id" && key !== "adminId")
          .reduce((obj, [key, value]) => {
            obj[key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")] = value || "N/A"
            return obj
          }, {}),
      ]
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = Array(Object.keys(excelData[0] || {}).length).fill({ wch: 15 })
    ws["!cols"] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31)) // Excel sheet names limited to 31 chars

    // Save file
    XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`)
    onClose()
  }

  const handleImageExport = async () => {
    try {
      // Find the main content area to capture
      const element = document.querySelector("[data-export-content]") || document.body

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      })

      // Convert to blob and download
      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.jpg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        },
        "image/jpeg",
        0.9,
      )

      onClose()
    } catch (error) {
      console.error("Image export failed:", error)
      alert("Image export failed. Please try again.")
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 2,
        },
      }}
    >
      <DialogContent>
        <Box sx={{ position: "relative" }}>
          {/* Close Button */}
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: -8,
              top: -8,
              backgroundColor: "#f5f5f5",
              border: "2px solid #e0e0e0",
              "&:hover": {
                backgroundColor: "#e0e0e0",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Export Options */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {exportOptions.map((option) => (
              <Grid item xs={12} sm={6} md={2.4} key={option.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    cursor: "pointer",
                    border: "2px solid transparent",
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      borderColor: option.borderColor,
                    },
                  }}
                  onClick={() => handleExport(option.id)}
                >
                  {/* Icon Container */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      backgroundColor: option.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                      position: "relative",
                    }}
                  >
                    {option.icon}
                    {/* File type badge */}
                    {option.id === "pdf" && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          backgroundColor: "#fff",
                          color: "#dc3545",
                          fontSize: "10px",
                          fontWeight: "bold",
                          px: 0.5,
                          py: 0.2,
                          borderRadius: 0.5,
                        }}
                      >
                        PDF
                      </Box>
                    )}
                    {option.id === "excel" && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          backgroundColor: "#fff",
                          color: "#28a745",
                          fontSize: "10px",
                          fontWeight: "bold",
                          px: 0.5,
                          py: 0.2,
                          borderRadius: 0.5,
                        }}
                      >
                        XLS
                      </Box>
                    )}
                    {(option.id === "jpeg1" || option.id === "jpeg2") && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          backgroundColor: "#fff",
                          color: option.id === "jpeg1" ? "#6f42c1" : "#dc3545",
                          fontSize: "10px",
                          fontWeight: "bold",
                          px: 0.5,
                          py: 0.2,
                          borderRadius: 0.5,
                        }}
                      >
                        JPEG
                      </Box>
                    )}
                  </Box>

                  {/* Label */}
                  <Typography variant="body2" fontWeight="medium" color="text.primary">
                    {option.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default ExportModal
