"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Avatar,
  IconButton,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const EmployeeTable = ({
  staffList = [],
  checkIns = [],
  checkOuts = [],
  loading = false,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);

  // Process and prepare attendance data
  useEffect(() => {
    if (staffList.length > 0) {
      console.log(
        `Processing ${checkIns.length} check-ins and ${checkOuts.length} check-outs for ${staffList.length} staff members`
      );

      // Create a map to store the latest check-in for each employee
      const employeeLatestCheckIns = new Map();

      // Process all check-ins to find the latest for each employee
      checkIns.forEach((checkIn) => {
        const employeeId = checkIn.employeeId;
        if (!employeeId) return;

        // Get check-in time
        let checkInTime = null;
        let checkInDate = null;

        try {
          if (checkIn.checkInTime) {
            checkInTime =
              typeof checkIn.checkInTime.toDate === "function"
                ? checkIn.checkInTime.toDate()
                : new Date(checkIn.checkInTime);

            checkInDate = new Date(checkInTime);
          } else if (checkIn.timestamp) {
            checkInDate =
              typeof checkIn.timestamp.toDate === "function"
                ? checkIn.timestamp.toDate()
                : new Date(checkIn.timestamp);

            checkInTime = checkInDate;
          } else if (checkIn.date) {
            checkInDate =
              typeof checkIn.date.toDate === "function"
                ? checkIn.date.toDate()
                : new Date(checkIn.date);

            checkInTime = checkInDate;
          }

          // Skip if we couldn't get a valid date
          if (!checkInDate || isNaN(checkInDate.getTime())) {
            return;
          }

          // If this is the first check-in for this employee or it's newer than the previous one
          if (
            !employeeLatestCheckIns.has(employeeId) ||
            checkInDate > employeeLatestCheckIns.get(employeeId).date
          ) {
            employeeLatestCheckIns.set(employeeId, {
              id: checkIn.id,
              date: checkInDate,
              checkInTime: checkInTime,
              checkOutTime: null, // Will be updated from checkOuts
              status: determineStatus(checkIn, checkInTime),
            });
          }
        } catch (error) {
          console.error(
            `Error processing check-in for employee ${employeeId}:`,
            error
          );
        }
      });

      // Process check-outs and match with check-ins
      checkOuts.forEach((checkOut) => {
        const employeeId = checkOut.employeeId;
        if (!employeeId) return;

        // Get check-out time
        let checkOutTime = null;

        try {
          if (checkOut.checkOutTime) {
            checkOutTime =
              typeof checkOut.checkOutTime.toDate === "function"
                ? checkOut.checkOutTime.toDate()
                : new Date(checkOut.checkOutTime);
          } else if (checkOut.timestamp) {
            checkOutTime =
              typeof checkOut.timestamp.toDate === "function"
                ? checkOut.timestamp.toDate()
                : new Date(checkOut.timestamp);
          }

          // Skip if we couldn't get a valid date
          if (!checkOutTime || isNaN(checkOutTime.getTime())) {
            return;
          }

          // If we have a check-in for this employee, update it with the check-out time
          if (employeeLatestCheckIns.has(employeeId)) {
            const checkInRecord = employeeLatestCheckIns.get(employeeId);

            // Only update if this check-out is on the same day as the check-in
            const checkInDate = new Date(checkInRecord.date);
            const checkOutDate = new Date(checkOutTime);

            if (checkInDate.toDateString() === checkOutDate.toDateString()) {
              checkInRecord.checkOutTime = checkOutTime;
            }
          }
        } catch (error) {
          console.error(
            `Error processing check-out for employee ${employeeId}:`,
            error
          );
        }
      });

      // Create combined employee and attendance data
      const combinedData = staffList.map((employee) => {
        const attendance = employeeLatestCheckIns.get(employee.uid) || null;

        return {
          ...employee,
          date: attendance?.date ? formatDate(attendance.date) : "N/A",
          checkIn: attendance?.checkInTime
            ? formatTime(attendance.checkInTime)
            : "N/A",
          checkOut: attendance?.checkOutTime
            ? formatTime(attendance.checkOutTime)
            : "N/A",
          totalHours: calculateTotalHours(
            attendance?.checkInTime,
            attendance?.checkOutTime
          ),
          status: attendance?.status || "Absent",
        };
      });

      // Sort by date (latest first)
      const sortedData = combinedData.sort((a, b) => {
        if (a.date === "N/A") return 1;
        if (b.date === "N/A") return -1;

        try {
          // Parse dates for comparison
          const dateA = a.date === "N/A" ? new Date(0) : parseDate(a.date);
          const dateB = b.date === "N/A" ? new Date(0) : parseDate(b.date);
          return dateB - dateA;
        } catch (error) {
          console.error("Error sorting dates:", error);
          return 0;
        }
      });

      setAttendanceData(sortedData);
    } else {
      setAttendanceData([]);
    }
  }, [staffList, checkIns, checkOuts]);

  // Helper function to parse a formatted date string back to Date object
  const parseDate = (dateString) => {
    const parts = dateString.split("/");
    if (parts.length === 3) {
      // Assuming MM/DD/YYYY format
      return new Date(parts[2], parts[0] - 1, parts[1]);
    }
    return new Date(dateString);
  };

  // Helper function to format dates consistently
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      // Check if date is a Firebase Timestamp or Date object
      if (typeof date.toDate === "function") {
        date = date.toDate();
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date object:", date);
        return "N/A";
      }

      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "N/A";
    }
  };

  const determineStatus = (checkIn, checkInTime) => {
    if (!checkInTime) return "Absent";

    try {
      // Create a cutoff time for the same day
      const checkInDate = new Date(checkInTime);
      const cutoffTime = new Date(
        checkInDate.getFullYear(),
        checkInDate.getMonth(),
        checkInDate.getDate(),
        9,
        0,
        0,
        0 // 9:00 AM cutoff
      );

      // Early morning cutoff (before 5 AM is considered late)
      const earlyMorningCutoff = new Date(
        checkInDate.getFullYear(),
        checkInDate.getMonth(),
        checkInDate.getDate(),
        5,
        0,
        0,
        0 // 5:00 AM cutoff for early morning
      );

      // Consider late if:
      // 1. Check-in is after 9:00 AM, or
      // 2. Check-in is before 5:00 AM (very early morning is considered late)
      if (checkInTime > cutoffTime || checkInTime < earlyMorningCutoff) {
        return "Late";
      }

      return "Present";
    } catch (error) {
      console.error("Error determining status:", error);
      return "Unknown";
    }
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    try {
      // Check if date is a Firebase Timestamp or Date object
      if (typeof date.toDate === "function") {
        date = date.toDate();
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid time object:", date);
        return "N/A";
      }

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error, date);
      return "N/A";
    }
  };

  const calculateTotalHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "N/A";

    try {
      // Convert Firebase Timestamps to Date objects if needed
      const checkInDate =
        typeof checkIn.toDate === "function" ? checkIn.toDate() : checkIn;
      const checkOutDate =
        typeof checkOut.toDate === "function" ? checkOut.toDate() : checkOut;

      // Check if dates are valid
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        console.warn("Invalid date objects for total hours calculation");
        return "N/A";
      }

      const diffMs = checkOutDate - checkInDate;
      if (diffMs <= 0) return "N/A";

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error("Error calculating hours:", error);
      return "N/A";
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Filter employees based on search term
  const filteredData = attendanceData.filter(
    (employee) =>
      (employee.firstName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.lastName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.department || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.designation || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.status || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate the filtered results
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "present":
        return "success";
      case "late":
        return "warning";
      case "absent":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <div>
      <div className="mb-4">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </div>

      <div className="flex items-center gap-2 my-7">
        <h4 className="text-lg font-semibold">
          Latest Employees Attendance
        </h4>
        <Chip className="text-end ml-auto" color="warning" label="Late"/>

        <Chip className="text-end" color="success" label="On Time"/>
      </div>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="employee table">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Check-in</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Check-out</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Total Hours</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} sx={{ color: "#4CAF50" }} />
                  <p className="mt-2">Loading employee data...</p>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((employee, index) => (
                <TableRow key={employee.uid || index}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      src={employee.photoURL}
                      alt={`${employee.firstName} ${employee.lastName}`}
                      sx={{ width: 36, height: 36, mr: 2 }}
                    >
                      {getInitials(employee.firstName, employee.lastName)}
                    </Avatar>
                    {employee.firstName} {employee.lastName}
                  </TableCell>
                  <TableCell>{employee.date}</TableCell>
                  <TableCell>{employee.checkIn}</TableCell>
                  <TableCell>{employee.checkOut}</TableCell>
                  <TableCell>{employee.totalHours}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        employee.status.toLowerCase() === "late"
                          ? "Present"
                          : employee.status
                      }
                      color={getStatusColor(employee.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default EmployeeTable;
