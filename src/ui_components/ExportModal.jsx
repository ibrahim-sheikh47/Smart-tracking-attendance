"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Link as LinkIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { format, parseISO } from "date-fns";
import HocLogo from "../assets/images/HocLogo.png"; // Adjust path if needed

const ExportModal = ({
  open,
  onClose,
  data,
  title = "Payroll Data",
  filterType = "monthly",
  selectedDate = null,
  selectedMonth = null,
  selectedYear = null,
  payrollData = null,
}) => {
  const [loading, setLoading] = useState(false);

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
  ];

  const getReportPeriodInfo = () => {
    const printDate = format(new Date(), "EEEE, MMMM dd, yyyy");
    let reportPeriod = "";
    let dayName = "";

    if (filterType === "daily" && selectedDate) {
      const targetDate = parseISO(selectedDate);
      dayName = format(targetDate, "EEEE");
      reportPeriod = format(targetDate, "MMMM dd, yyyy");
    } else if (selectedMonth !== null && selectedYear !== null) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      reportPeriod = `${monthNames[selectedMonth]} ${selectedYear}`;
    }

    return { printDate, reportPeriod, dayName };
  };

  // Filter payroll data based on the selected view
  const getFilteredPayrollData = () => {
    if (!payrollData || !payrollData.daily) {
      return [];
    }

    if (filterType === "daily" && selectedDate) {
      // For daily view, get only the selected day's data
      const targetDay = payrollData.daily.find(
        (day) => day.dateStr === selectedDate
      );
      if (targetDay) {
        return targetDay.employeePayments
          .filter((emp) => emp.status === "Present" && emp.pay > 0)
          .map((emp) => ({
            name: emp.name,
            department: emp.department || "N/A",
            date: targetDay.formattedDate,
            dayName: targetDay.dayName,
            totalPay: `D${emp.pay.toFixed(2)}`,
            overtime: emp.overtime > 0 ? `${emp.overtime}h` : "None",
            status: emp.status,
          }));
      }
      return [];
    } else {
      // For monthly view, get all days with payroll data
      const monthlyData = [];
      payrollData.daily
        .filter((day) => day.totalPay > 0)
        .forEach((day) => {
          day.employeePayments
            .filter((emp) => emp.status === "Present" && emp.pay > 0)
            .forEach((emp) => {
              monthlyData.push({
                name: emp.name,
                department: emp.department || "N/A",
                date: day.formattedDate,
                dayName: day.dayName,
                totalPay: `D${emp.pay.toFixed(2)}`,
                overtime: emp.overtime > 0 ? `${emp.overtime}h` : "None",
                status: emp.status,
              });
            });
        });
      return monthlyData;
    }
  };

  const handleExport = async (type) => {
    setLoading(true);
    try {
      switch (type) {
        case "link":
          await handleShareLink();
          break;
        case "pdf":
          await handlePDFExport();
          break;
        case "excel":
          await handleExcelExport();
          break;
        case "jpeg1":
        case "jpeg2":
          await handleImageExport();
          break;
        default:
          console.log("Export type not implemented:", type);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
    onClose();
  };

  const handlePDFExport = () => {
    const doc = new jsPDF();
    const { printDate, reportPeriod, dayName } = getReportPeriodInfo();
    const filteredData = getFilteredPayrollData();

    const img = new Image();
    img.src = HocLogo;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Create canvas to get base64
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const base64Image = canvas.toDataURL("image/png");

      // Maintain aspect ratio
      const originalWidth = img.width;
      const originalHeight = img.height;
      const maxWidth = 40;
      const ratio = originalHeight / originalWidth;
      const calculatedHeight = maxWidth * ratio;

      // Add logo (right corner)
      doc.addImage(base64Image, "PNG", 150, 5, maxWidth, calculatedHeight);

      // Title
      doc.setFontSize(20);
      doc.text(title, 20, 20);

      // Report period information
      doc.setFontSize(12);
      if (filterType === "daily" && dayName) {
        doc.text(`Report Day: ${dayName}, ${reportPeriod}`, 20, 35);
        doc.text(`Print Date: ${printDate}`, 20, 45);
      } else {
        doc.text(`Report Period: ${reportPeriod}`, 20, 35);
        doc.text(`Print Date: ${printDate}`, 20, 45);
      }

      // Add payroll data table
      if (filteredData && filteredData.length > 0) {
        const tableColumns = [
          "Employee Name",
          "Department",
          "Date",
          "Day",
          "Total Pay",
          "Overtime",
          "Status",
        ];
        const tableRows = filteredData.map((item) => [
          item.name || "N/A",
          item.department || "N/A",
          item.date || "N/A",
          item.dayName || "N/A",
          item.totalPay || "D0.00",
          item.overtime || "None",
          item.status || "N/A",
        ]);

        // Calculate total pay for the period
        const totalPay = filteredData.reduce((sum, item) => {
          const pay = Number.parseFloat(item.totalPay.replace("D", "")) || 0;
          return sum + pay;
        }, 0);

        // Add summary before table
        doc.setFontSize(12);
        doc.text(
          `Total ${
            filterType === "daily" ? "Daily" : "Monthly"
          } Pay: D${totalPay.toFixed(2)}`,
          20,
          60
        );
        doc.text(`Total Records: ${filteredData.length}`, 20, 70);

        // Add table to PDF
        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: 80,
          styles: {
            fontSize: 9,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [61, 194, 150],
            textColor: 255,
            fontSize: 10,
          },
          columnStyles: {
            0: { cellWidth: 30 }, // Employee Name
            1: { cellWidth: 25 }, // Department
            2: { cellWidth: 25 }, // Date
            3: { cellWidth: 20 }, // Day
            4: { cellWidth: 25 }, // Total Pay
            5: { cellWidth: 20 }, // Overtime
            6: { cellWidth: 20 }, // Status
          },
        });
      } else {
        // No data message
        doc.setFontSize(14);
        doc.text(
          `No payroll data available for ${
            filterType === "daily" ? "this day" : "this month"
          }.`,
          20,
          60
        );
      }

      // Save the file with period information
      const fileName =
        filterType === "daily" && selectedDate
          ? `${title.replace(/\s+/g, "_")}_${selectedDate}.pdf`
          : `${title.replace(/\s+/g, "_")}_${reportPeriod.replace(
              /\s+/g,
              "_"
            )}.pdf`;

      doc.save(fileName);
      onClose();
    };

    img.onerror = () => {
      // Fallback without logo
      const { printDate, reportPeriod, dayName } = getReportPeriodInfo();
      const filteredData = getFilteredPayrollData();

      doc.setFontSize(20);
      doc.text(title, 20, 20);

      doc.setFontSize(12);
      if (filterType === "daily" && dayName) {
        doc.text(`Report Day: ${dayName}, ${reportPeriod}`, 20, 35);
        doc.text(`Print Date: ${printDate}`, 20, 45);
      } else {
        doc.text(`Report Period: ${reportPeriod}`, 20, 35);
        doc.text(`Print Date: ${printDate}`, 20, 45);
      }

      // Add payroll data table (same as above)
      if (filteredData && filteredData.length > 0) {
        const tableColumns = [
          "Employee Name",
          "Department",
          "Date",
          "Day",
          "Total Pay",
          "Overtime",
          "Status",
        ];
        const tableRows = filteredData.map((item) => [
          item.name || "N/A",
          item.department || "N/A",
          item.date || "N/A",
          item.dayName || "N/A",
          item.totalPay || "D0.00",
          item.overtime || "None",
          item.status || "N/A",
        ]);

        const totalPay = filteredData.reduce((sum, item) => {
          const pay = Number.parseFloat(item.totalPay.replace("D", "")) || 0;
          return sum + pay;
        }, 0);

        doc.setFontSize(14);
        doc.text(
          `Total ${
            filterType === "daily" ? "Daily" : "Monthly"
          } Pay: D${totalPay.toFixed(2)}`,
          20,
          60
        );
        doc.text(`Total Records: ${filteredData.length}`, 20, 70);

        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: 80,
          styles: {
            fontSize: 9,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [61, 194, 150],
            textColor: 255,
            fontSize: 10,
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 },
          },
        });
      } else {
        doc.setFontSize(14);
        doc.text(
          `No payroll data available for ${
            filterType === "daily" ? "this day" : "this month"
          }.`,
          20,
          60
        );
      }

      const fileName =
        filterType === "daily" && selectedDate
          ? `${title.replace(/\s+/g, "_")}_${selectedDate}.pdf`
          : `${title.replace(/\s+/g, "_")}_${reportPeriod.replace(
              /\s+/g,
              "_"
            )}.pdf`;

      doc.save(fileName);
      onClose();
    };
  };

  const handleExcelExport = () => {
    const { printDate, reportPeriod, dayName } = getReportPeriodInfo();
    const filteredData = getFilteredPayrollData();

    if (!filteredData || filteredData.length === 0) {
      alert("No payroll data to export for the selected period");
      return;
    }

    // Prepare data for Excel
    const excelData = filteredData.map((record) => ({
      "Employee Name": record.name || "N/A",
      Department: record.department || "N/A",
      Date: record.date || "N/A",
      Day: record.dayName || "N/A",
      "Total Pay": record.totalPay || "D0.00",
      Overtime: record.overtime || "None",
      Status: record.status || "N/A",
    }));

    // Calculate total pay
    const totalPay = filteredData.reduce((sum, item) => {
      const pay = Number.parseFloat(item.totalPay.replace("D", "")) || 0;
      return sum + pay;
    }, 0);

    // Add report metadata at the beginning
    const metadataRows = [
      { "Report Information": "Value" },
      { "Report Information": "Report Title", Value: title },
      {
        "Report Information":
          filterType === "daily" ? "Report Day" : "Report Period",
        Value:
          filterType === "daily" && dayName
            ? `${dayName}, ${reportPeriod}`
            : reportPeriod,
      },
      { "Report Information": "Print Date", Value: printDate },
      {
        "Report Information": `Total ${
          filterType === "daily" ? "Daily" : "Monthly"
        } Pay`,
        Value: `D${totalPay.toFixed(2)}`,
      },
      { "Report Information": "Total Records", Value: filteredData.length },
      { "Report Information": "", Value: "" }, // Empty row separator
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Create metadata worksheet
    const metadataWs = XLSX.utils.json_to_sheet(metadataRows);
    XLSX.utils.book_append_sheet(wb, metadataWs, "Report Info");

    // Create data worksheet
    const dataWs = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = Array(Object.keys(excelData[0] || {}).length).fill({
      wch: 15,
    });
    dataWs["!cols"] = colWidths;

    // Add data worksheet to workbook
    XLSX.utils.book_append_sheet(wb, dataWs, "Payroll Data");

    // Save file with period information
    const fileName =
      filterType === "daily" && selectedDate
        ? `${title.replace(/\s+/g, "_")}_${selectedDate}.xlsx`
        : `${title.replace(/\s+/g, "_")}_${reportPeriod.replace(
            /\s+/g,
            "_"
          )}.xlsx`;

    XLSX.writeFile(wb, fileName);
    onClose();
  };

  const handleImageExport = async () => {
    try {
      // Find the main content area to capture
      const element =
        document.querySelector("[data-export-content]") || document.body;
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Convert to blob and download
      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          const { reportPeriod } = getReportPeriodInfo();
          const fileName =
            filterType === "daily" && selectedDate
              ? `${title.replace(/\s+/g, "_")}_${selectedDate}.jpg`
              : `${title.replace(/\s+/g, "_")}_${reportPeriod.replace(
                  /\s+/g,
                  "_"
                )}.jpg`;

          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        "image/jpeg",
        0.9
      );
      onClose();
    } catch (error) {
      console.error("Image export failed:", error);
      alert("Image export failed. Please try again.");
    }
  };

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

          {/* Report Information */}
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Export {title}
            </Typography>
            {(() => {
              const { reportPeriod, dayName } = getReportPeriodInfo();
              return (
                <Typography variant="body2" color="text.secondary">
                  {filterType === "daily" && dayName
                    ? `${dayName}, ${reportPeriod}`
                    : reportPeriod}
                </Typography>
              );
            })()}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {filterType === "daily"
                ? "Daily Payroll Report"
                : "Monthly Payroll Report"}
            </Typography>
          </Box>

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
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color="text.primary"
                  >
                    {option.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
