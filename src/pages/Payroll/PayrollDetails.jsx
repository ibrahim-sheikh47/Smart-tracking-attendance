"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WorkIcon from "@mui/icons-material/Work";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PaidIcon from "@mui/icons-material/Paid";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ChevronLeft } from "@mui/icons-material";
import CustomButton from "../../ui_components/CustomButton";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { firestoreDb } from "../../config/firebase.jsx";
import { format, differenceInMinutes } from "date-fns";
import { getAuth } from "firebase/auth";

const PayrollDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get employee ID from URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCompExpanded, setTotalCompExpanded] = useState(false);
  const [overtimeExpanded, setOvertimeExpanded] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);

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

  // Fetch employee data when admin data is available
  useEffect(() => {
    if (currentAdmin && id) {
      fetchEmployeeData(id);
    }
  }, [id, currentAdmin]);

  const fetchEmployeeData = async (employeeId) => {
    try {
      setLoading(true);

      // Verify the admin has access to this employee
      if (adminId && adminId !== currentAdmin.id) {
        setError("You don't have permission to view this employee's payroll");
        setLoading(false);
        return;
      }

      // Fetch employee basic info from the main employees collection
      const employeeDocRef = doc(firestoreDb, "employees", employeeId);
      const employeeSnapshot = await getDoc(employeeDocRef);

      if (!employeeSnapshot.exists()) {
        setError(
          "Employee not found or you don't have permission to view this employee"
        );
        setLoading(false);
        return;
      }

      const employeeData = employeeSnapshot.data();

      // Verify this admin has access to this employee
      if (employeeData.adminId !== currentAdmin.id) {
        setError("You don't have permission to view this employee's payroll");
        setLoading(false);
        return;
      }

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
      checkInsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.checkInTime) {
          let checkInTime;
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
            sessionId: data.sessionId,
            isLate: data.isLate || false,
          });
        }
      });

      const checkOuts = [];
      checkOutsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.checkOutTime) {
          let checkOutTime;
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
            sessionId: data.sessionId,
            isEarly: data.isEarly || false,
          });
        }
      });

      // Calculate total working hours and overtime
      let totalWorkingMinutes = 0;
      let totalOvertimeMinutes = 0;

      // Match check-ins with check-outs by sessionId
      checkIns.forEach((checkIn) => {
        const matchingCheckOut = checkOuts.find(
          (checkOut) => checkOut.sessionId === checkIn.sessionId
        );

        if (matchingCheckOut) {
          const workingMinutes = differenceInMinutes(
            matchingCheckOut.time,
            checkIn.time
          );

          if (workingMinutes > 0) {
            totalWorkingMinutes += workingMinutes;

            // Calculate overtime (assuming 8 hours standard workday)
            const standardWorkdayMinutes = 8 * 60;
            if (workingMinutes > standardWorkdayMinutes) {
              totalOvertimeMinutes += workingMinutes - standardWorkdayMinutes;
            }
          }
        }
      });

      // Convert minutes to hours and minutes format
      const totalWorkingHours = Math.floor(totalWorkingMinutes / 60);
      const remainingWorkingMinutes = totalWorkingMinutes % 60;

      const totalOvertimeHours = Math.floor(totalOvertimeMinutes / 60);
      const remainingOvertimeMinutes = totalOvertimeMinutes % 60;

      // Check if employee is present today
      const today = format(new Date(), "yyyy-MM-dd");
      const isTodayPresent = checkIns.some(
        (checkIn) => format(checkIn.time, "yyyy-MM-dd") === today
      );

      // Calculate compensation
      const hourlyRate = employeeData.hourlyRate || 0;
      const overtimeRate = employeeData.overtimeRate || hourlyRate * 1.5;
      const regularMinutes = totalWorkingMinutes - totalOvertimeMinutes;
      const regularHours = regularMinutes / 60;
      const overtimeHours = totalOvertimeMinutes / 60;

      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * overtimeRate;
      const totalPay = regularPay + overtimePay;

      // Calculate monthly values (assuming 4 weeks in a month)
      const hoursPerWeek = employeeData.workingHours || 40;
      const hoursPerMonth = hoursPerWeek * 4;

      // Prepare the employee data object
      const formattedEmployee = {
        id: employeeId,
        name: `${employeeData.firstName || ""} ${
          employeeData.lastName || ""
        }`.trim(),
        title: employeeData.jobTitle || employeeData.title || "Employee",
        avatar: employeeData.photoURL || "",
        status: isTodayPresent ? "Active" : "Inactive",
        email: employeeData.email || "",
        department: employeeData.department || "N/A",
        phone: employeeData.phoneNumber || "N/A",
        totalHours: `${hoursPerMonth} hours`,
        workingHours: `${totalWorkingHours} hours ${remainingWorkingMinutes} mins`,
        overTime:
          totalOvertimeMinutes > 0
            ? `${totalOvertimeHours} hours ${remainingOvertimeMinutes} mins`
            : "0 hours",
        hourlyRate: `D ${hourlyRate.toFixed(2)}`,
        salary: `D ${totalPay.toFixed(2)}`,
        totalCompensation: `D ${regularPay.toFixed(2)}`,
        overtimePay: `D ${overtimePay.toFixed(2)}`,
        compDetails: {
          compPerHour: `D ${hourlyRate.toFixed(2)}`,
          hoursPerWeek: `${hoursPerWeek} hours`,
          hoursPerMonth: `${hoursPerMonth} hours`,
          calculation: `${hourlyRate.toFixed(2)} x ${regularHours.toFixed(2)}`,
        },
        overtimeDetails: {
          compPerHour: `D ${hourlyRate.toFixed(2)} x 1.5`,
          hoursPerWeek: `${(totalOvertimeHours / 4).toFixed(1)} hours`,
          hoursPerMonth: `${totalOvertimeHours.toFixed(1)} hours`,
          calculation: `${hourlyRate.toFixed(
            2
          )} x 1.5 x ${totalOvertimeHours.toFixed(2)}`,
        },
        adminId: currentAdmin.id,
      };

      setEmployee(formattedEmployee);
      setError(null);
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setError("Failed to load employee data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return `${parts[0]?.charAt(0) || ""}${
      parts[1]?.charAt(0) || ""
    }`.toUpperCase();
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ChevronLeft />}
            onClick={() => navigate("/payroll")}
          >
            Back to Payroll
          </Button>
        </Box>
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No employee data found.</Alert>
        <Box sx={{ mt: 2 }}>
          <IconButton onClick={() => navigate("/payroll")}>
            <ChevronLeft /> Back to Payroll
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Header with Back Button and Export */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={() => navigate("/payroll")} sx={{ mr: 1 }}>
              <ChevronLeft />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {employee.name}
              </Typography>
            </Box>
          </Box>
          <CustomButton
            title={"Export"}
            style={"text-white w-[110px] h-[40px]"}
          />
        </Box>

        {/* Employee Profile */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            gap: 3,
            backgroundColor: "#F9F9F9",
            padding: 3,
            borderRadius: 3,
          }}
        >
          {employee.avatar ? (
            <Avatar
              src={employee.avatar}
              sx={{
                width: 120,
                height: 120,
                border: "3px solid #f5f5f5",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                borderRadius: 3,
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 120,
                height: 120,
                border: "3px solid #f5f5f5",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                borderRadius: 3,
                bgcolor: "#3DC296",
                fontSize: 48,
              }}
            >
              {getInitials(employee.name)}
            </Avatar>
          )}
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {employee.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {employee.title}
            </Typography>

            <div className="flex flex-wrap gap-6 md:gap-20">
              <div className="">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{employee.status}</p>
              </div>
              <div className="">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{employee.email}</p>
              </div>
              <div className="">
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{employee.department}</p>
              </div>
              <div className="">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{employee.phone}</p>
              </div>
            </div>
          </Box>
        </Box>

        {/* Hours and Rate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 w-full">
          <div className="bg-gray-100 p-4 shadow-sm rounded-md h-full">
            <div className="flex items-center mb-2">
              <AccessTimeIcon className="text-gray-600 mr-2" fontSize="small" />
              <p className="text-sm text-gray-500">Total Hours Per Month</p>
            </div>
            <p className="text-lg font-bold">{employee.totalHours}</p>
          </div>

          <div className="bg-gray-100 p-4 shadow-sm rounded-md h-full">
            <div className="flex items-center mb-2">
              <WorkIcon className="text-gray-600 mr-2" fontSize="small" />
              <p className="text-sm text-gray-500">Working Hours</p>
            </div>
            <div className="flex items-center">
              <p className="text-lg font-bold">{employee.workingHours}</p>
              <CheckCircleIcon
                className="text-teal-600 ml-2"
                fontSize="small"
              />
            </div>
          </div>

          <div className="bg-gray-100 p-4 shadow-sm rounded-md h-full">
            <div className="flex items-center mb-2">
              <ScheduleIcon className="text-gray-600 mr-2" fontSize="small" />
              <p className="text-sm text-gray-500">Over Time</p>
            </div>
            <p className="text-lg font-bold">{employee.overTime}</p>
          </div>

          <div className="bg-gray-100 p-4 shadow-sm rounded-md h-full">
            <div className="flex items-center mb-2">
              <PaidIcon className="text-gray-600 mr-2" fontSize="small" />
              <p className="text-sm text-gray-500">Hourly Rate</p>
            </div>
            <div className="flex items-center">
              <p className="text-lg font-bold">{employee.hourlyRate}</p>
              <CheckCircleIcon
                className="text-teal-600 ml-2"
                fontSize="small"
              />
            </div>
          </div>
        </div>

        {/* Salary */}
        <Box
          sx={{
            border: "2px solid #3DC296",
            borderRadius: 2,
            background: "#3DC29610",
            p: 2,
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ color: "#00000080" }}>Salary</Typography>
          <Typography variant="h6" fontWeight="bold">
            {employee.salary}
          </Typography>
        </Box>

        {/* Total Compensation */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#f9f9f9",
              p: 2,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              cursor: "pointer",
            }}
            onClick={() => setTotalCompExpanded(!totalCompExpanded)}
          >
            <Typography sx={{ color: "#00000080" }}>
              Total Compensation
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                {employee.totalCompensation}
              </Typography>
              {totalCompExpanded ? (
                <KeyboardArrowUpIcon />
              ) : (
                <KeyboardArrowDownIcon />
              )}
            </Box>
          </Box>
          <Collapse in={totalCompExpanded} timeout="auto" unmountOnExit>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ borderTop: "none" }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Comp/Hour</TableCell>
                    <TableCell>Hours/wk</TableCell>
                    <TableCell>Hours/Month</TableCell>
                    <TableCell>Comp x Hours/Month</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{employee.compDetails.compPerHour}</TableCell>
                    <TableCell>{employee.compDetails.hoursPerWeek}</TableCell>
                    <TableCell>{employee.compDetails.hoursPerMonth}</TableCell>
                    <TableCell>{employee.compDetails.calculation}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Box>

        {/* Overtime */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#f9f9f9",
              p: 2,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              cursor: "pointer",
            }}
            onClick={() => setOvertimeExpanded(!overtimeExpanded)}
          >
            <Typography sx={{ color: "#00000080" }}>Overtime</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                {employee.overtimePay}
              </Typography>
              {overtimeExpanded ? (
                <KeyboardArrowUpIcon />
              ) : (
                <KeyboardArrowDownIcon />
              )}
            </Box>
          </Box>
          <Collapse in={overtimeExpanded} timeout="auto" unmountOnExit>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ borderTop: "none" }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Comp/Hour</TableCell>
                    <TableCell>Hours/wk</TableCell>
                    <TableCell>Hours/Month</TableCell>
                    <TableCell>Comp x Hours/Month</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      {employee.overtimeDetails.compPerHour}
                    </TableCell>
                    <TableCell>
                      {employee.overtimeDetails.hoursPerWeek}
                    </TableCell>
                    <TableCell>
                      {employee.overtimeDetails.hoursPerMonth}
                    </TableCell>
                    <TableCell>
                      {employee.overtimeDetails.calculation}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Box>
      </Paper>
    </Box>
  );
};

export default PayrollDetail;
