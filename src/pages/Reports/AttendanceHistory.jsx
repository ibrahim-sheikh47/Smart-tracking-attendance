"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material"
import { Search as SearchIcon, ChevronLeft } from "@mui/icons-material"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
import { firestoreDb } from "../../config/firebase.jsx"
import CustomButton from "../../ui_components/CustomButton.jsx"
import { getAuth } from "firebase/auth"
import { format, differenceInMinutes } from "date-fns"
import ExportModal from "../../ui_components/ExportModal"

export default function AttendanceHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const adminId = queryParams.get("adminId")

  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [employeeInfo, setEmployeeInfo] = useState(null)
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Get the current admin user
  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      const auth = getAuth()
      const user = auth.currentUser

      if (user) {
        try {
          // Get the admin document
          const adminDoc = await getDoc(doc(firestoreDb, "admins", user.uid))
          if (adminDoc.exists()) {
            setCurrentAdmin({ id: adminDoc.id, ...adminDoc.data() })
          } else {
            console.error("Admin document not found")
            setError("Admin account not found. Please contact support.")
          }
        } catch (error) {
          console.error("Error fetching admin data:", error)
          setError("Failed to load admin data. Please try again.")
        }
      } else {
        setError("You must be logged in as an admin to view this page.")
      }
    }

    fetchCurrentAdmin()
  }, [])

  // Get employee ID from URL parameters
  const pathParts = window.location.pathname.split("/")
  const employeeId = pathParts[pathParts.indexOf("reports") + 1]

  useEffect(() => {
    if (currentAdmin && employeeId) {
      fetchEmployeeInfo()
      fetchAttendanceData()
    }
  }, [employeeId, currentAdmin])

  const fetchEmployeeInfo = async () => {
    try {
      // Verify the admin has access to this employee
      if (adminId && adminId !== currentAdmin.id) {
        setError("You don't have permission to view this employee's attendance history")
        return
      }

      // Fetch employee basic info from the admin's subcollection
      const employeeDocRef = doc(firestoreDb, "admins", currentAdmin.id, "employees", employeeId)
      const employeeSnapshot = await getDoc(employeeDocRef)

      if (employeeSnapshot.exists()) {
        const data = employeeSnapshot.data()
        setEmployeeInfo({
          id: employeeSnapshot.id,
          name: `${data.firstName} ${data.lastName}`,
          adminId: currentAdmin.id,
        })
      } else {
        setError("Employee not found or you don't have permission to view this employee")
      }
    } catch (err) {
      console.error("Error fetching employee info:", err)
      setError("Failed to load employee information")
    }
  }

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)

      // Fetch check-ins for this employee
      const checkInsRef = collection(firestoreDb, "CheckIns")
      const checkInsQuery = query(checkInsRef, where("employeeId", "==", employeeId))
      const checkInsSnapshot = await getDocs(checkInsQuery)

      // Fetch check-outs for this employee
      const checkOutsRef = collection(firestoreDb, "CheckOuts")
      const checkOutsQuery = query(checkOutsRef, where("employeeId", "==", employeeId))
      const checkOutsSnapshot = await getDocs(checkOutsQuery)

      // Process check-ins and check-outs
      const checkIns = []
      checkInsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.checkInTime) {
          let checkInTime
          if (data.checkInTime.toDate) {
            checkInTime = data.checkInTime.toDate()
          } else if (data.checkInTime.seconds) {
            checkInTime = new Date(data.checkInTime.seconds * 1000)
          } else {
            checkInTime = new Date(data.checkInTime)
          }

          checkIns.push({
            id: doc.id,
            time: checkInTime,
            sessionId: data.sessionId,
            isLate: data.isLate || false,
            date: format(checkInTime, "yyyy-MM-dd"),
            formattedTime: format(checkInTime, "HH:mm"),
          })
        }
      })

      const checkOuts = []
      checkOutsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.checkOutTime) {
          let checkOutTime
          if (data.checkOutTime.toDate) {
            checkOutTime = data.checkOutTime.toDate()
          } else if (data.checkOutTime.seconds) {
            checkOutTime = new Date(data.checkOutTime.seconds * 1000)
          } else {
            checkOutTime = new Date(data.checkOutTime)
          }

          checkOuts.push({
            id: doc.id,
            time: checkOutTime,
            sessionId: data.sessionId,
            isEarly: data.isEarly || false,
            date: format(checkOutTime, "yyyy-MM-dd"),
            formattedTime: format(checkOutTime, "HH:mm"),
          })
        }
      })

      // Combine check-ins and check-outs by date and session
      const attendanceByDate = {}

      // Process check-ins
      checkIns.forEach((checkIn) => {
        if (!attendanceByDate[checkIn.date]) {
          attendanceByDate[checkIn.date] = {
            date: checkIn.date,
            formattedDate: format(new Date(checkIn.date), "dd MMMM yyyy"),
            checkInTime: checkIn.formattedTime,
            checkOutTime: "N/A",
            sessionId: checkIn.sessionId,
            status: "Present",
          }
        } else {
          attendanceByDate[checkIn.date].checkInTime = checkIn.formattedTime
          attendanceByDate[checkIn.date].sessionId = checkIn.sessionId
        }
      })

      // Process check-outs and match with check-ins
      checkOuts.forEach((checkOut) => {
        if (attendanceByDate[checkOut.date]) {
          attendanceByDate[checkOut.date].checkOutTime = checkOut.formattedTime
        } else {
          attendanceByDate[checkOut.date] = {
            date: checkOut.date,
            formattedDate: format(new Date(checkOut.date), "dd MMMM yyyy"),
            checkInTime: "N/A",
            checkOutTime: checkOut.formattedTime,
            sessionId: checkOut.sessionId,
            status: "Present",
          }
        }
      })

      // Calculate working hours and convert to array
      const attendanceList = Object.values(attendanceByDate).map((record) => {
        let workingHours = "N/A"
        if (record.checkInTime !== "N/A" && record.checkOutTime !== "N/A") {
          // Parse times
          const checkInParts = record.checkInTime.split(":")
          const checkOutParts = record.checkOutTime.split(":")

          // Create Date objects for today with these times
          const today = new Date()
          const checkInDate = new Date(today)
          checkInDate.setHours(Number.parseInt(checkInParts[0]), Number.parseInt(checkInParts[1]), 0)

          const checkOutDate = new Date(today)
          checkOutDate.setHours(Number.parseInt(checkOutParts[0]), Number.parseInt(checkOutParts[1]), 0)

          // Calculate difference in minutes
          const diffMinutes = differenceInMinutes(checkOutDate, checkInDate)
          if (diffMinutes > 0) {
            const hours = Math.floor(diffMinutes / 60)
            const minutes = diffMinutes % 60
            workingHours = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} Hours`
          }
        }

        return {
          ...record,
          workingHours,
          id: `${record.date}-${record.sessionId || "unknown"}`,
        }
      })

      // Sort by date (newest first)
      attendanceList.sort((a, b) => new Date(b.date) - new Date(a.date))

      setAttendanceData(attendanceList)
      setError(null)
    } catch (err) {
      console.error("Error fetching attendance data:", err)
      setError("Failed to load attendance data")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(`/reports?id=${employeeId}&adminId=${currentAdmin?.id || ""}`)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }

  const handleExportClick = () => {
    setExportModalOpen(true)
  }

  // Filter data based on search term
  const filteredData = attendanceData.filter((row) => {
    return (
      row.formattedDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Get current page data
  const currentPageData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ margin: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <IconButton onClick={() => navigate("/manage-staff")}>
            <ChevronLeft /> Back to Staff Management
          </IconButton>
        </Box>
      </Box>
    )
  }

  return (
    <>
      {/* Header and Back Button */}
      <Box sx={{ display: "flex", alignItems: "center", marginY: 5, marginX: 2 }}>
        <IconButton onClick={handleBack} sx={{ marginRight: 1 }}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6">
          Attendance History
          {employeeInfo && ` - ${employeeInfo.name}`}
        </Typography>
      </Box>

      {/* Search and Export */}
      <Paper sx={{ margin: 3, padding: 3, borderRadius: 4 }} data-export-content>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
            <CustomButton title={"Export"} style={"text-white w-[110px] h-[40px]"} onClick={handleExportClick} />
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
              </TableRow>
            </TableHead>
            <TableBody>
              {currentPageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                currentPageData.map((row) => (
                  <TableRow key={row.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      {row.formattedDate}
                    </TableCell>
                    <TableCell>{row.checkInTime}</TableCell>
                    <TableCell>{row.checkOutTime}</TableCell>
                    <TableCell>{row.workingHours}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: row.status === "Present" ? "#16a34a" : "error.main",
                          }}
                        />
                        {row.status}
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
            Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredData.length)} from{" "}
            {filteredData.length}
          </Typography>
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      </Paper>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={attendanceData}
        title={`Attendance History - ${employeeInfo?.name || "Employee"}`}
      />
    </>
  )
}
