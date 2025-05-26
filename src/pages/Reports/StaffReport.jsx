"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Paper,
  Avatar,
  Typography,
  Box,
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
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  QrCode,
  Search as SearchIcon,
  Edit as EditIcon,
  FileDownload as ExportIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { firestoreDb } from "../../config/firebase.jsx";
import { getAuth } from "firebase/auth";
import InputField from "../../ui_components/InputField.jsx";
import assets from "../../constants/assets.jsx";
import AttendanceReportCard from "../../ui_components/AttendanceReportCard.jsx";
import AttendanceChart from "../../components/AttendanceChart.jsx";
import QrCodeDialog from "../../ui_components/QrDialog.jsx";
import {
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  differenceInMinutes,
} from "date-fns";
import ExportModal from "../../ui_components/ExportModal";

export default function Reports() {
  const location = useLocation();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [chartData, setChartData] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    onTime: 0,
    overtime: 0,
    totalWorkingHours: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "MMMM")
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Get employee ID from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const employeeId = queryParams.get("id");

  // Get the current admin user
  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          // Get the admin document
          const adminDoc = await getDoc(doc(firestoreDb, "admins", user.uid));
          if (adminDoc.exists()) {
            setCurrentAdmin({ id: adminDoc.id, ...adminDoc.data() });
          } else {
            console.error("Admin document not found");
            setError("Admin account not found. Please contact support.");
          }
        } catch (error) {
          console.error("Error fetching admin data:", error);
          setError("Failed to load admin data. Please try again.");
        }
      } else {
        setError("You must be logged in as an admin to view this page.");
      }
    };

    fetchCurrentAdmin();
  }, []);

  // Fetch departments from Firebase
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const departmentsRef = collection(firestoreDb, "departments");
      const departmentsSnapshot = await getDocs(departmentsRef);

      const departmentsList = [];
      departmentsSnapshot.forEach((doc) => {
        const departmentData = doc.data();
        departmentsList.push({
          value: departmentData.name || doc.id,
          label: departmentData.displayName || departmentData.name || doc.id,
        });
      });

      // Sort departments alphabetically
      departmentsList.sort((a, b) => a.label.localeCompare(b.label));
      setDepartments(departmentsList);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setSnackbar({
        open: true,
        message: "Failed to load departments list",
        severity: "error",
      });
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch employee data or all employees
  useEffect(() => {
    if (currentAdmin) {
      if (employeeId) {
        fetchSingleEmployee();
        fetchDepartments(); // Fetch departments for edit mode
      } else {
        fetchAllEmployees();
      }
    }
  }, [employeeId, currentAdmin]);

  // Fetch attendance data when employee changes
  useEffect(() => {
    if (employee) {
      fetchAttendanceData();
    }
  }, [employee, selectedMonth]);

  const fetchSingleEmployee = async () => {
    try {
      setLoading(true);

      // Get the employee directly from the employees collection
      const employeeDoc = await getDoc(
        doc(firestoreDb, "employees", employeeId)
      );

      if (employeeDoc.exists()) {
        const data = employeeDoc.data();
        console.log("Employee data retrieved:", data);
        const employeeData = {
          ...data,
          id: employeeDoc.id,
          name: `${data.firstName} ${data.lastName}`,
        };
        setEmployee(employeeData);
        setFormValues(employeeData);
      } else {
        console.error(`Employee document with ID ${employeeId} not found`);
        setError(
          `Employee with ID ${employeeId} not found. Please check the employee ID.`
        );
      }
    } catch (err) {
      console.error("Error fetching employee data:", err);
      // Log more specific error details
      if (err.code) {
        console.error(`Firebase error code: ${err.code}`);
      }
      setError(`Failed to load employee data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      if (!employee) return;

      // Get the selected month's date range
      const currentYear = new Date().getFullYear();
      const monthIndex = new Date(
        `${selectedMonth} 1, ${currentYear}`
      ).getMonth();
      const firstDay = startOfMonth(new Date(currentYear, monthIndex));
      const lastDay = endOfMonth(new Date(currentYear, monthIndex));

      console.log(
        `Fetching attendance data for ${format(
          firstDay,
          "yyyy-MM-dd"
        )} to ${format(lastDay, "yyyy-MM-dd")}`
      );

      // Fetch check-ins for this employee
      const checkInsRef = collection(firestoreDb, "CheckIns");
      const checkInsQuery = query(
        checkInsRef,
        where("employeeId", "==", employeeId)
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);

      // Fetch check-outs for this employee
      const checkOutsRef = collection(firestoreDb, "CheckOuts");
      const checkOutsQuery = query(
        checkOutsRef,
        where("employeeId", "==", employeeId)
      );
      const checkOutsSnapshot = await getDocs(checkOutsQuery);

      // Process check-ins and check-outs
      const checkIns = [];
      const checkOuts = [];

      checkInsSnapshot.forEach((doc) => {
        const data = doc.data();
        let checkInTime;

        if (data.checkInTime) {
          if (data.checkInTime.toDate) {
            checkInTime = data.checkInTime.toDate();
          } else if (data.checkInTime.seconds) {
            checkInTime = new Date(data.checkInTime.seconds * 1000);
          } else {
            checkInTime = new Date(data.checkInTime);
          }

          checkIns.push({
            id: doc.id,
            time: checkInTime,
            isLate: data.isLate || false,
            lateMinutes: data.lateMinutes || 0,
            date: format(checkInTime, "yyyy-MM-dd"),
          });
        }
      });

      checkOutsSnapshot.forEach((doc) => {
        const data = doc.data();
        let checkOutTime;

        if (data.checkOutTime) {
          if (data.checkOutTime.toDate) {
            checkOutTime = data.checkOutTime.toDate();
          } else if (data.checkOutTime.seconds) {
            checkOutTime = new Date(data.checkOutTime.seconds * 1000);
          } else {
            checkOutTime = new Date(data.checkOutTime);
          }

          checkOuts.push({
            id: doc.id,
            time: checkOutTime,
            date: format(checkOutTime, "yyyy-MM-dd"),
          });
        }
      });

      console.log(
        `Found ${checkIns.length} check-ins and ${checkOuts.length} check-outs`
      );

      // Filter for the selected month
      const monthlyCheckIns = checkIns.filter((checkIn) =>
        isWithinInterval(checkIn.time, { start: firstDay, end: lastDay })
      );

      const monthlyCheckOuts = checkOuts.filter((checkOut) =>
        isWithinInterval(checkOut.time, { start: firstDay, end: lastDay })
      );

      console.log(
        `${monthlyCheckIns.length} check-ins and ${monthlyCheckOuts.length} check-outs in selected month`
      );

      // Calculate working hours by matching check-ins with check-outs
      let totalWorkingMinutes = 0;
      let totalLateMinutes = 0;
      let presentDays = 0;
      let onTimeDays = 0;
      // Get the employee's creation date
      const employeeCreationDate = employee.createdAt
        ? employee.createdAt.toDate
          ? employee.createdAt.toDate()
          : new Date(employee.createdAt.seconds * 1000)
        : new Date(currentYear, monthIndex, 1); // Fallback to first day of current month

      // Calculate working days from employee creation date or start of month (whichever is later)
      const startDateForCalculation = isWithinInterval(employeeCreationDate, {
        start: firstDay,
        end: lastDay,
      })
        ? employeeCreationDate
        : firstDay;

      const today = new Date();
      const endDateForCalculation = isWithinInterval(today, {
        start: firstDay,
        end: lastDay,
      })
        ? today
        : lastDay;

      // Count actual working days (excluding weekends)
      let workingDays = 0;
      const currentDate = new Date(startDateForCalculation);
      while (currentDate <= endDateForCalculation) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Not weekend (0 = Sunday, 6 = Saturday)
          workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      const dailyData = {};

      // Process each check-in
      monthlyCheckIns.forEach((checkIn) => {
        // Find matching check-out for the same day
        const matchingCheckOut = monthlyCheckOuts.find(
          (checkOut) => checkOut.date === checkIn.date
        );

        if (matchingCheckOut) {
          // Calculate working minutes for this day
          const workingMinutes = differenceInMinutes(
            matchingCheckOut.time,
            checkIn.time
          );

          if (workingMinutes > 0) {
            totalWorkingMinutes += workingMinutes;

            // Track present days
            presentDays++;

            // Track on-time days
            if (!checkIn.isLate) {
              onTimeDays++;
            } else {
              totalLateMinutes += checkIn.lateMinutes;
            }

            // Add to daily data
            const day = Number.parseInt(format(checkIn.time, "d"));
            dailyData[day] = {
              presents: 1,
              lateArrivals: checkIn.isLate ? 1 : 0,
              absents: 0,
              workingHours: Math.round((workingMinutes / 60) * 10) / 10, // Round to 1 decimal place
            };
          }
        } else {
          // Check-in without check-out still counts as present
          presentDays++;

          if (!checkIn.isLate) {
            onTimeDays++;
          } else {
            totalLateMinutes += checkIn.lateMinutes;
          }

          // Add to daily data
          const day = Number.parseInt(format(checkIn.time, "d"));
          dailyData[day] = {
            presents: 1,
            lateArrivals: checkIn.isLate ? 1 : 0,
            absents: 0,
            workingHours: 0, // No working hours calculated without check-out
          };
        }
      });

      // Calculate absents
      const absentDays = workingDays - presentDays;

      // Fill in absent days in the daily data
      const startDay = startDateForCalculation.getDate();
      const endDay = endDateForCalculation.getDate();
      for (let day = startDay; day <= endDay; day++) {
        if (!dailyData[day]) {
          // Check if this day is a weekend
          const date = new Date(currentYear, monthIndex, day);
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday

          if (!isWeekend) {
            dailyData[day] = {
              presents: 0,
              lateArrivals: 0,
              absents: 1,
              workingHours: 0,
            };
          }
        }
      }
      // Convert daily data to chart format
      const chartDataArray = Object.keys(dailyData).map((day) => ({
        name: day,
        presents: dailyData[day].presents,
        lateArrivals: dailyData[day].lateArrivals,
        absents: dailyData[day].absents,
      }));

      // Sort chart data by day
      chartDataArray.sort(
        (a, b) => Number.parseInt(a.name) - Number.parseInt(b.name)
      );

      // Calculate on-time percentage
      const onTimePercentage =
        presentDays > 0 ? Math.round((onTimeDays / presentDays) * 100) : 0;

      // Convert total working minutes to hours
      const totalWorkingHours =
        Math.round((totalWorkingMinutes / 60) * 10) / 10;

      // Update state
      setAttendanceSummary({
        present: presentDays,
        absent: absentDays,
        onTime: `${onTimePercentage}%`,
        overtime: `${totalLateMinutes} min`,
        totalWorkingHours: totalWorkingHours,
      });

      setChartData(chartDataArray);

      console.log(
        `Attendance summary: ${presentDays} present, ${absentDays} absent, ${onTimePercentage}% on time, ${totalWorkingHours} working hours`
      );
    } catch (err) {
      console.error("Error fetching attendance data:", err);
      setSnackbar({
        open: true,
        message: "Failed to load attendance data",
        severity: "error",
      });
    }
  };

  const fetchAllEmployees = async () => {
    try {
      if (!currentAdmin) return;

      setLoading(true);

      // Get all employees from the main employees collection
      const employeesRef = collection(firestoreDb, "employees");
      const employeesSnapshot = await getDocs(employeesRef);

      const employeeList = [];
      const checkInsRef = collection(firestoreDb, "CheckIns");
      const checkOutsRef = collection(firestoreDb, "CheckOuts");

      for (const doc of employeesSnapshot.docs) {
        const data = doc.data();
        const employeeId = doc.id;

        // Fetch check-ins for this employee
        const checkInsQuery = query(
          checkInsRef,
          where("employeeId", "==", employeeId)
        );
        const checkInsSnapshot = await getDocs(checkInsQuery);

        // Fetch check-outs for this employee
        const checkOutsQuery = query(
          checkOutsRef,
          where("employeeId", "==", employeeId)
        );
        const checkOutsSnapshot = await getDocs(checkOutsQuery);

        // Process check-ins and check-outs
        const checkIns = [];
        const checkOuts = [];

        checkInsSnapshot.forEach((doc) => {
          const data = doc.data();
          let checkInTime;

          if (data.checkInTime) {
            if (data.checkInTime.toDate) {
              checkInTime = data.checkInTime.toDate();
            } else if (data.checkInTime.seconds) {
              checkInTime = new Date(data.checkInTime.seconds * 1000);
            } else {
              checkInTime = new Date(data.checkInTime);
            }

            checkIns.push({
              id: doc.id,
              time: checkInTime,
              isLate: data.isLate || false,
              lateMinutes: data.lateMinutes || 0,
              date: format(checkInTime, "yyyy-MM-dd"),
            });
          }
        });

        checkOutsSnapshot.forEach((doc) => {
          const data = doc.data();
          let checkOutTime;

          if (data.checkOutTime) {
            if (data.checkOutTime.toDate) {
              checkOutTime = data.checkOutTime.toDate();
            } else if (data.checkOutTime.seconds) {
              checkOutTime = new Date(data.checkOutTime.seconds * 1000);
            } else {
              checkOutTime = new Date(data.checkOutTime);
            }

            checkOuts.push({
              id: doc.id,
              time: checkOutTime,
              date: format(checkOutTime, "yyyy-MM-dd"),
            });
          }
        });

        // Calculate working hours by matching check-ins with check-outs
        let totalWorkingMinutes = 0;
        let totalLateMinutes = 0;
        let presentDays = 0;

        // Process each check-in
        checkIns.forEach((checkIn) => {
          // Find matching check-out for the same day
          const matchingCheckOut = checkOuts.find(
            (checkOut) => checkOut.date === checkIn.date
          );

          if (matchingCheckOut) {
            // Calculate working minutes for this day
            const workingMinutes = differenceInMinutes(
              matchingCheckOut.time,
              checkIn.time
            );

            if (workingMinutes > 0) {
              totalWorkingMinutes += workingMinutes;
              presentDays++;

              if (checkIn.isLate) {
                totalLateMinutes += checkIn.lateMinutes;
              }
            }
          } else {
            // Check-in without check-out still counts as present
            presentDays++;

            if (checkIn.isLate) {
              totalLateMinutes += checkIn.lateMinutes;
            }
          }
        });

        // Get the employee's creation date
        const employeeCreationDate = data.createdAt
          ? data.createdAt.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt.seconds * 1000)
          : new Date(); // Fallback to today if no creation date

        // Get the current month's date range
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const firstDay = startOfMonth(new Date(currentYear, currentMonth));
        const lastDay = endOfMonth(new Date(currentYear, currentMonth));
        const today = new Date();

        // Calculate working days from employee creation date or start of month (whichever is later)
        const startDateForCalculation = isWithinInterval(employeeCreationDate, {
          start: firstDay,
          end: lastDay,
        })
          ? employeeCreationDate
          : firstDay;

        const endDateForCalculation = isWithinInterval(today, {
          start: firstDay,
          end: lastDay,
        })
          ? today
          : lastDay;

        // Count actual working days (excluding weekends)
        let workingDays = 0;
        const currentDate = new Date(startDateForCalculation);
        while (currentDate <= endDateForCalculation) {
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // Not weekend (0 = Sunday, 6 = Saturday)
            workingDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate absents based on actual working days
        const absentDays = workingDays - presentDays;

        // Convert total working minutes to hours
        const totalWorkingHours =
          Math.round((totalWorkingMinutes / 60) * 10) / 10;

        // Calculate overtime hours (convert minutes to hours)
        const overtimeHours = Math.round((totalLateMinutes / 60) * 10) / 10;

        employeeList.push({
          id: employeeId,
          name: `${data.firstName} ${data.lastName}`,
          department: data.department || "Not specified",
          designation: data.designation || "Not specified",
          email: data.email,
          phoneNumber: data.phoneNumber,
          photoURL: data.photoURL,
          present: presentDays,
          absents: absentDays,
          overtime: `${overtimeHours} hour${overtimeHours !== 1 ? "s" : ""}`,
          workingHours: totalWorkingHours,
          hourlyRate: data.hourlyRate,
          overtimeRate: data.overtimeRate,
          adminId: data.adminId,
        });
      }

      setEmployees(employeeList);
    } catch (err) {
      console.error("Error fetching employees data:", err);
      setError("Failed to load employees data");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/manage-staff");
  };

  const handleViewHistory = (id) => {
    navigate(`/reports/${id}/history`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleOpenQrDialog = (employee) => {
    setSelectedEmployee(employee);
    setQrDialogOpen(true);
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleEditToggle = () => {
    if (editMode) {
      // If we're exiting edit mode without saving, reset form values
      setFormValues({ ...employee });
      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleSaveChanges = () => {
    setConfirmDialogOpen(true);
  };

  const confirmSaveChanges = async () => {
    try {
      setLoading(true);

      // Update employee document in Firestore
      const employeeRef = doc(firestoreDb, "employees", employeeId);
      await updateDoc(employeeRef, {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        department: formValues.department,
        designation: formValues.designation,
        bio: formValues.bio,
        phoneNumber: formValues.phoneNumber,
        workingHours: formValues.workingHours,
        hourlyRate: formValues.hourlyRate,
        overtimeRate: formValues.overtimeRate,
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setEmployee({
        ...employee,
        ...formValues,
        name: `${formValues.firstName} ${formValues.lastName}`,
      });

      setEditMode(false);
      setConfirmDialogOpen(false);

      setSnackbar({
        open: true,
        message: "Employee information updated successfully",
        severity: "success",
      });
    } catch (err) {
      console.error("Error updating employee:", err);
      setSnackbar({
        open: true,
        message: `Failed to update employee: ${err.message}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleExportClick = () => {
    setExportModalOpen(true);
  };

  // Get initials for the avatar fallback
  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return `${parts[0]?.charAt(0) || ""}${
      parts[1]?.charAt(0) || ""
    }`.toUpperCase();
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (error && employeeId) {
    return (
      <Box p={4}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Staff Management
        </Button>
      </Box>
    );
  }

  // If employeeId is provided, show single employee report
  if (employeeId && employee) {
    return (
      <div className="flex items-start gap-5 m-5" data-export-content>
        <div className="max-w-[400px] bg-[#F9F9F9] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <p>Person info</p>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={handleSaveChanges}
                    className="border-2 text-sm border-[#3DC296] text-[#3DC296] px-4 py-2 rounded-lg font-bold cursor-pointer flex items-center gap-1 save-button"
                  >
                    <SaveIcon fontSize="small" />
                    Save
                  </button>

                  <button
                    onClick={handleEditToggle}
                    className="border-2 text-sm border-gray-500 text-gray-500 px-4 py-2 rounded-lg font-bold cursor-pointer flex items-center gap-1 cancel-button"
                  >
                    <CancelIcon fontSize="small" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="border-2 text-sm border-blue-500 text-blue-500 px-4 py-2 rounded-lg font-bold cursor-pointer flex items-center gap-1 edit-button"
                  >
                    <EditIcon fontSize="small" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleOpenQrDialog(employee)}
                    className="border-2 text-sm border-black text-black px-4 py-2 rounded-lg font-bold cursor-pointer qr-button"
                  >
                    <QrCode />
                  </button>
                </>
              )}
            </div>
          </div>

          <Divider sx={{ marginY: 2 }} />

          <div className="mx-auto">
            {employee?.photoURL ? (
              <Avatar
                src={employee.photoURL}
                alt={employee.name}
                sx={{
                  width: 102,
                  height: 102,
                  marginRight: 2,
                  marginX: "auto",
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 102,
                  height: 102,
                  marginRight: 2,
                  marginX: "auto",
                  borderRadius: 3,
                }}
                alt={employee?.name}
              >
                {getInitials(employee?.name)}
              </Avatar>
            )}
          </div>

          <div className="flex flex-col gap-7 mt-5">
            <div className="flex gap-3 mt-5">
              {editMode ? (
                <>
                  <TextField
                    label="First Name"
                    name="firstName"
                    value={formValues.firstName || ""}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Last Name"
                    name="lastName"
                    value={formValues.lastName || ""}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                  />
                </>
              ) : (
                <>
                  <InputField
                    label={"First Name"}
                    value={employee?.firstName}
                    disabled
                  />
                  <InputField
                    label={"Last Name"}
                    value={employee?.lastName}
                    disabled
                  />
                </>
              )}
            </div>
            {editMode ? (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formValues.department || ""}
                    onChange={handleInputChange}
                    label="Department"
                    disabled={loadingDepartments}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Designation"
                  name="designation"
                  value={formValues.designation || ""}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Bio"
                  name="bio"
                  value={formValues.bio || ""}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                />
                <TextField
                  label="Email"
                  name="email"
                  value={formValues.email || ""}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Email cannot be changed as it is a unique identifier"
                  fullWidth
                  size="small"
                  type="email"
                  disabled={true}
                />
                <TextField
                  label="Phone"
                  name="phoneNumber"
                  value={formValues.phoneNumber || ""}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Working Hours (per week)"
                  name="workingHours"
                  value={formValues.workingHours || ""}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  type="number"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">hours</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Per Hour Rate"
                  name="hourlyRate"
                  value={formValues.hourlyRate || ""}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  type="number"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">Dalasi</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Overtime Hourly Rate"
                  name="overtimeRate"
                  value={formValues.overtimeRate || ""}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  type="number"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">Dalasi</InputAdornment>
                    ),
                  }}
                />
              </>
            ) : (
              <>
                <InputField
                  label={"Department"}
                  value={employee?.department}
                  disabled={true}
                />
                <InputField
                  label={"Designation"}
                  value={employee?.designation}
                  disabled={true}
                />
                <InputField
                  label={"Supervisor"}
                  value={employee?.supervisorName}
                  disabled={true}
                />
                <InputField
                  label={"Bio"}
                  value={employee?.bio}
                  disabled={true}
                />
                <InputField
                  label={"Email"}
                  value={employee?.email}
                  disabled={true}
                />
                <InputField
                  label={"Phone"}
                  value={employee?.phoneNumber}
                  disabled={true}
                />
                <InputField
                  label={"Working Hours (per week)"}
                  value={`${employee?.workingHours || 40} hours`}
                  disabled={true}
                />
                <InputField
                  label={"Per Hour Rate"}
                  value={`${employee?.hourlyRate || 40} hours`}
                  disabled={true}
                />
                <InputField
                  label={"Overtime Hourly Rate"}
                  value={`${employee?.overtimeRate || 40} hours`}
                  disabled={true}
                />
              </>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-[#F9F9F9] p-4 rounded-2xl">
            <div className="flex justify-between items-center">
              <p>Attendance Report</p>
              <div className="flex gap-2">
                <button
                  className="border-2 text-sm border-[#3DC296] text-[#3DC296] px-4 py-2 rounded-lg font-bold cursor-pointer view-history-button"
                  onClick={() => handleViewHistory(employeeId)}
                >
                  View History
                </button>
                <button
                  className="border-2 text-sm border-blue-500 text-blue-500 px-4 py-2 rounded-lg font-bold cursor-pointer export-button"
                  onClick={handleExportClick}
                >
                  <ExportIcon fontSize="small" className="mr-1" />
                  Export
                </button>
              </div>
            </div>

            <Divider sx={{ marginY: 3 }} />

            <div className="grid grid-rows-2 grid-cols-2 gap-4">
              <AttendanceReportCard
                title={"Total Present"}
                value={attendanceSummary.present}
                style={"bg-[#3DC29610] border-2 border-[#3DC296]"}
                icon={assets.presentIcon}
              />
              <AttendanceReportCard
                title={"Total absents"}
                value={attendanceSummary.absent}
                style={"bg-[#EC091B1A] border-2 border-[#EC091B]"}
                icon={assets.absentsIcon}
              />
              <AttendanceReportCard
                title={"On Time"}
                value={attendanceSummary.onTime}
                style={"bg-[#00A2FF1A] border-2 border-[#00A2FF]"}
                icon={assets.onTimeIcon}
              />
              <AttendanceReportCard
                title={"Working Hours"}
                value={`${attendanceSummary.totalWorkingHours} hrs`}
                style={"bg-[#FFBB001A] border-2 border-[#FFBB00]"}
                icon={assets.overTimeIcon}
              />
            </div>
            <div className="bg-white p-4 mt-5 rounded-2xl">
              <div className="flex justify-between items-center">
                <div className="pt-2">
                  <p className="text-lg font-bold text-[#24282E]">
                    Attendance Statistics
                  </p>
                  <p className="text-sm font-medium text-[#727A90]">
                    Overview of attendance for {employee.name}.
                  </p>
                </div>
                <InputField
                  dropdown={true}
                  value={selectedMonth}
                  options={options}
                  onChange={handleMonthChange}
                />
              </div>
              <Divider sx={{ marginY: 2 }} />
              <AttendanceChart data={chartData} />
            </div>
          </div>
        </div>

        {/* QR Code Dialog */}
        <QrCodeDialog
          open={qrDialogOpen}
          onClose={handleCloseQrDialog}
          employee={selectedEmployee}
        />

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          <DialogTitle>Confirm Changes</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to save these changes to the employee
              profile?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={confirmSaveChanges}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Export Modal */}
        <ExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          data={{
            ...employee,
            ...attendanceSummary,
            chartData,
          }}
          title={`Employee Report - ${employee.name}`}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    );
  }

  // If no employeeId is provided, show all employees report
  return (
    <Box sx={{ p: 3 }} data-export-content>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Staff Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all staff here
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          sx={{
            backgroundColor: "#3DC296",
            "&:hover": { backgroundColor: "#2ea37b" },
          }}
          onClick={handleExportClick}
        >
          Export All
        </Button>
      </Box>

      <Paper sx={{ width: "100%", mb: 2, borderRadius: 2, overflow: "hidden" }}>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight="medium">
            Employees Reports
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              placeholder="Search..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Show
              </Typography>
              <TextField
                select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                SelectProps={{
                  native: true,
                }}
                size="small"
                sx={{ width: 70 }}
              >
                {[5, 10, 25, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </TextField>
            </Box>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Present</TableCell>
                <TableCell>Absents</TableCell>
                <TableCell>Overtime</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee, index) => {
                  const isItemSelected = isSelected(employee.id);

                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={employee.id}
                      selected={isItemSelected}
                    >
                      <TableCell></TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            src={employee.photoURL}
                            alt={employee.name}
                            sx={{ width: 36, height: 36, mr: 2 }}
                          >
                            {getInitials(employee.name)}
                          </Avatar>
                          <Typography variant="body2">
                            {employee.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.present}</TableCell>
                      <TableCell>{employee.absents}</TableCell>
                      <TableCell>{employee.overtime}</TableCell>
                      <TableCell>{employee.createdBy}</TableCell>
                    </TableRow>
                  );
                })}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      No employees found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <Box sx={{ p: 2, borderTop: "1px solid #eee" }}>
          <Typography variant="body2" color="text.secondary">
            Showing {page * rowsPerPage + 1}-
            {Math.min((page + 1) * rowsPerPage, filteredEmployees.length)} from{" "}
            {filteredEmployees.length}
          </Typography>
        </Box>
      </Paper>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={filteredEmployees}
        title="Staff Reports"
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const options = [
  { value: "January", label: "January" },
  { value: "February", label: "February" },
  { value: "March", label: "March" },
  { value: "April", label: "April" },
  { value: "May", label: "May" },
  { value: "June", label: "June" },
  { value: "July", label: "July" },
  { value: "August", label: "August" },
  { value: "September", label: "September" },
  { value: "October", label: "October" },
  { value: "November", label: "November" },
  { value: "December", label: "December" },
];
