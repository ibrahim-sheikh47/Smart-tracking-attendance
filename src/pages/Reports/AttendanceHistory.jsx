import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
  ChevronLeft,
} from "@mui/icons-material";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestoreDb } from "../../config/firebase.jsx";
import CustomButton from "../../ui_components/CustomButton.jsx";

export default function AttendanceHistory() {
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeInfo, setEmployeeInfo] = useState(null);

  // Get employee ID from URL parameters
  const pathParts = window.location.pathname.split("/");
  const employeeId = pathParts[pathParts.indexOf("reports") + 1];

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      try {
        // Fetch employee basic info for the header
        const employeeDoc = await getDocs(
          query(
            collection(firestoreDb, "employees"),
            where("__name__", "==", employeeId)
          )
        );

        if (!employeeDoc.empty) {
          const data = employeeDoc.docs[0].data();
          setEmployeeInfo({
            id: employeeDoc.docs[0].id,
            name: `${data.firstName} ${data.lastName}`,
          });
        }
      } catch (err) {
        console.error("Error fetching employee info:", err);
      }
    };

    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        // Fetch attendance records for this employee
        const attendanceQuery = query(
          collection(firestoreDb, "attendance"),
          where("employeeId", "==", employeeId)
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceList = attendanceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Format dates if needed
          date: doc.data().date?.toDate
            ? doc.data().date.toDate().toLocaleDateString()
            : doc.data().date,
          checkInTime: doc.data().checkInTime || "N/A",
          checkOutTime: doc.data().checkOutTime || "N/A",
        }));

        setAttendanceData(attendanceList);
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError("Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeInfo();
    fetchAttendanceData();
  }, [employeeId]);

  const handleBack = () => {
    navigate(`/reports?id=${employeeId}`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

//   const handleExport = () => {
//     // Implement export functionality here
//     alert("Export functionality will be implemented here");
//   };

  // Filter data based on search term
  const filteredData = attendanceData.filter((row) => {
    return (
      row.date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate working hours from check-in and check-out times
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (checkIn === "N/A" || checkOut === "N/A") return "N/A";

    // Example calculation - you'll need to adapt this to your actual time format
    const checkInTime = checkIn.split(":");
    const checkOutTime = checkOut.split(":");

    const checkInMinutes =
      parseInt(checkInTime[0]) * 60 + parseInt(checkInTime[1]);
    const checkOutMinutes =
      parseInt(checkOutTime[0]) * 60 + parseInt(checkOutTime[1]);

    const diffMinutes = checkOutMinutes - checkInMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} Hours`;
  };

  const generateMockData = () => {
    // Generate mock data for demonstration
    return Array.from({ length: 30 }, (_, index) => ({
      id: `record-${index}`,
      date: `29 February 2025`,
      checkInTime: "09:02",
      checkOutTime: "17:04",
      workingHours: "08:02 Hours",
      status: "Present",
    }));
  };

  // Use mock data if no actual data is available
  const displayData =
    attendanceData.length > 0 ? filteredData : generateMockData();

  // Get current page data
  const currentPageData = displayData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      {/* Header and Back Button */}
      <Box sx={{ display: "flex", alignItems: "center", marginY: 5 , marginX:2 }}>
        <IconButton onClick={handleBack} sx={{ marginRight: 1 }}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6">
          Attendance History {employeeInfo && `- ${employeeInfo.name}`}
        </Typography>
      </Box>

      {/* Search and Export */}
      <Paper sx={{ margin: 3, padding: 3, borderRadius: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems:"center",
            marginBottom: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Staff Report
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              placeholder="Search..."
              size="small"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <CustomButton
                title={"Export"}
                style={"text-white w-[110px] h-[40px]"}
            />
          </Box>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} elevation={0} sx={{ marginTop: 2 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Check-in</TableCell>
                <TableCell>Check-out</TableCell>
                <TableCell>Working Hours</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ color: "error.main" }}
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : currentPageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                currentPageData.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.date}
                    </TableCell>
                    <TableCell>{row.checkInTime}</TableCell>
                    <TableCell>{row.checkOutTime}</TableCell>
                    <TableCell>
                      {row.workingHours ||
                        calculateWorkingHours(
                          row.checkInTime,
                          row.checkOutTime
                        )}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor:
                              row.status === "Present"
                                ? "#16a34a"
                                : "error.main",
                          }}
                        />
                        {row.status}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <IconButton size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing {page * rowsPerPage + 1}-
            {Math.min((page + 1) * rowsPerPage, displayData.length)} from{" "}
            {displayData.length}
          </Typography>
          <TablePagination
            component="div"
            count={displayData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      </Paper>
    </>
  );
}
