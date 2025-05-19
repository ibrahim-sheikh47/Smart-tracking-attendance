"use client"

import { useState } from "react"
import { DataGrid } from "@mui/x-data-grid"
import { Avatar, Dialog, DialogTitle, DialogContent, IconButton, Box, Typography } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

const EmployeeModal = ({ title, employees, onClose }) => {
  const [pageSize, setPageSize] = useState(10)

  // Get initials for the avatar fallback
  const getInitials = (name) => {
    if (!name) return ""
    const parts = name.split(" ")
    return `${parts[0]?.charAt(0) || ""}${parts[1]?.charAt(0) || ""}`.toUpperCase()
  }

  // Define columns based on the data
  const getColumns = () => {
    const baseColumns = [
      {
        field: "name",
        headerName: "Name",
        width: 250,
        renderCell: (params) => (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {params.row.profileImageUrl ? (
              <Avatar src={params.row.profileImageUrl} alt={params.value} sx={{ width: 40, height: 40 }} />
            ) : (
              <Avatar sx={{ width: 40, height: 40, bgcolor: "#3DC296" }} alt={params.value}>
                {getInitials(params.value)}
              </Avatar>
            )}
            {params.value}
          </div>
        ),
      },
      { field: "department", headerName: "Department", width: 150 },
      { field: "designation", headerName: "Designation", width: 150 },
      { field: "email", headerName: "Email", width: 220 },
      { field: "phoneNumber", headerName: "Phone", width: 150 },
      { field: "status", headerName: "Status", width: 150 },
    ]

    // Add check-in time column if it exists in the data
    if (employees.length > 0 && employees[0].hasOwnProperty("checkInTime")) {
      baseColumns.push({ field: "checkInTime", headerName: "Check-in Time", width: 150 })
    }

    return baseColumns
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: "#f9f9f9", borderBottom: "1px solid #eee" }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, minHeight: "60vh" }}>
        {employees.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "text.secondary",
            }}
          >
            <Typography variant="body1">No employees found</Typography>
          </Box>
        ) : (
          <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={employees}
              columns={getColumns()}
              pageSize={pageSize}
              onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
              rowsPerPageOptions={[5, 10, 20, 50]}
              disableSelectionOnClick
              sx={{
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f9f9f9",
                },
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EmployeeModal
