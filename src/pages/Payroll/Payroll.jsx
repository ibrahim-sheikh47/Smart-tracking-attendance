"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  TextField,
  Avatar,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CustomButton from "../../ui_components/CustomButton";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
} from "firebase/firestore";
import { firestoreDb } from "../../config/firebase.jsx";
import { differenceInMinutes } from "date-fns";
import { getAuth } from "firebase/auth";
import PayrollSummary from "../../components/PayrollSummary";
import ExportModal from "../../ui_components/ExportModal.jsx";

const Payroll = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState({
    filterType: "monthly",
    selectedDate: "",
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    payrollData: null,
  });

  // Get the current admin user
  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        try {
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

  // Fetch employees - memoized to prevent unnecessary re-fetches
  const fetchEmployees = useCallback(async () => {
    if (!currentAdmin) return;

    try {
      setLoading(true);

      const employeesCollection = collection(firestoreDb, "employees");
      const employeeSnapshot = await getDocs(employeesCollection);

      const employeePromises = employeeSnapshot.docs.map(async (doc) => {
        const employeeData = doc.data();
        const employeeId = doc.id;

        // Fetch check-ins
        const checkInsRef = collection(firestoreDb, "CheckIns");
        const checkInsQuery = query(
          checkInsRef,
          where("employeeId", "==", employeeId)
        );
        const checkInsSnapshot = await getDocs(checkInsQuery);

        // Fetch check-outs
        const checkOutsRef = collection(firestoreDb, "CheckOuts");
        const checkOutsQuery = query(
          checkOutsRef,
          where("employeeId", "==", employeeId)
        );
        const checkOutsSnapshot = await getDocs(checkOutsQuery);

        // Process check-ins
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

        // Process check-outs
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

        // Calculate working hours
        let totalWorkingMinutes = 0;
        let totalOvertimeMinutes = 0;

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
              const standardWorkdayMinutes = 8 * 60;
              if (workingMinutes > standardWorkdayMinutes) {
                totalOvertimeMinutes += workingMinutes - standardWorkdayMinutes;
              }
            }
          }
        });

        const totalWorkingHours = Math.floor(totalWorkingMinutes / 60);
        const remainingWorkingMinutes = totalWorkingMinutes % 60;
        const totalOvertimeHours = Math.floor(totalOvertimeMinutes / 60);
        const remainingOvertimeMinutes = totalOvertimeMinutes % 60;

        // Calculate pay
        const hourlyRate =
          typeof employeeData.hourlyRate === "number"
            ? employeeData.hourlyRate
            : Number.parseFloat(employeeData.hourlyRate) || 15;
        const overtimeRate =
          typeof employeeData.overtimeRate === "number"
            ? employeeData.overtimeRate
            : Number.parseFloat(employeeData.overtimeRate) || hourlyRate * 1.5;

        const regularHours = totalWorkingHours - totalOvertimeHours;
        const regularPay = regularHours > 0 ? regularHours * hourlyRate : 0;
        const overtimePay = totalOvertimeHours * overtimeRate;
        const totalPay = regularPay + overtimePay;

        // Handle department
        let department = "N/A";
        if (employeeData.department) {
          department = employeeData.department;
        } else if (employeeData.Department) {
          department = employeeData.Department;
        } else if (employeeData.dept) {
          department = employeeData.dept;
        } else if (employeeData.Dept) {
          department = employeeData.Dept;
        } else if (employeeData.departmentName) {
          department = employeeData.departmentName;
        }

        return {
          id: employeeId,
          name:
            `${employeeData.firstName || ""} ${
              employeeData.lastName || ""
            }`.trim() || "Unknown Employee",
          comp: `D${Number(hourlyRate).toFixed(2)}`,
          hours: `${
            employeeData.workingHours || employeeData.WorkingHours || 40
          } hours`,
          overtime:
            totalOvertimeMinutes > 0
              ? `${totalOvertimeHours} hour${
                  totalOvertimeHours !== 1 ? "s" : ""
                } ${remainingOvertimeMinutes} min${
                  remainingOvertimeMinutes !== 1 ? "s" : ""
                }`
              : "None",
          avatar: employeeData.photoURL || employeeData.avatar || "",
          department: department,
          totalWorkingTime: `${totalWorkingHours} hour${
            totalWorkingHours !== 1 ? "s" : ""
          } ${remainingWorkingMinutes} min${
            remainingWorkingMinutes !== 1 ? "s" : ""
          }`,
          totalPay: `D${totalPay.toFixed(2)}`,
          email: employeeData.email || employeeData.Email || "",
          phoneNumber:
            employeeData.phoneNumber ||
            employeeData.phone ||
            employeeData.Phone ||
            "",
          adminId: employeeData.adminId || employeeData.AdminId || "",
        };
      });

      const employeeList = await Promise.all(employeePromises);
      setEmployees(employeeList);
      setError(null);
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setError(`Failed to load employee data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentAdmin]);

  // Fetch employees when admin is available
  useEffect(() => {
    if (currentAdmin) {
      fetchEmployees();
    }
  }, [currentAdmin, fetchEmployees]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(1);
  }, []);

  const handleSearch = useCallback((event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page on search
  }, []);

  const handleSelectOne = useCallback((event, id) => {
    // Stop event propagation to prevent conflicts
    event.stopPropagation();

    setSelected((prevSelected) => {
      const selectedIndex = prevSelected.indexOf(id);
      if (selectedIndex === -1) {
        return [...prevSelected, id];
      }
      return prevSelected.filter((itemId) => itemId !== id);
    });
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleExportClick = useCallback(() => {
    setExportModalOpen(true);
  }, []);

  const handleFilterChange = useCallback((filterInfo) => {
    setCurrentFilter(filterInfo);
  }, []);

  const handleEmployeeClick = useCallback(
    (event, employee) => {
      // Stop propagation to prevent row selection
      event.stopPropagation();
      navigate(
        `/payroll/payroll-detail/${employee.id}?adminId=${employee.adminId}`
      );
    },
    [navigate]
  );

  // Memoized filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Memoized current page employees
  const currentEmployees = useMemo(() => {
    const indexOfLastEmployee = page * rowsPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - rowsPerPage;
    return filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  }, [filteredEmployees, page, rowsPerPage]);

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return `${parts[0]?.charAt(0) || ""}${
      parts[1]?.charAt(0) || ""
    }`.toUpperCase();
  };

  const indexOfLastEmployee = page * rowsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - rowsPerPage;

  return (
    <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
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
              Staff Payroll
            </Typography>
          </Box>
          <CustomButton
            title={"Export All"}
            style={"text-white w-[110px] h-[40px]"}
            onClick={handleExportClick}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Payroll Summary" />
          <Tab label="Employee Details" />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        <PayrollSummary
          employees={employees}
          loading={loading}
          onFilterChange={handleFilterChange}
        />
      ) : (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Employees Payroll Reports
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                placeholder="Search by name or department..."
                size="small"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 250 }}
              />
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={rowsPerPage.toString()}
                  onChange={handleChangeRowsPerPage}
                  renderValue={(value) => `Show: ${value}`}
                  IconComponent={KeyboardArrowDownIcon}
                >
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="25">25</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                  <MenuItem value="100">100</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f9f9f9" }}>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Employee Name</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Comp/Hour</TableCell>
                      <TableCell>Hours/wk</TableCell>
                      <TableCell>Overtime</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentEmployees.map((employee, index) => {
                      const isItemSelected = selected.includes(employee.id);
                      return (
                        <TableRow
                          key={employee.id}
                          hover
                          selected={isItemSelected}
                          onClick={(event) =>
                            handleSelectOne(event, employee.id)
                          }
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell padding="checkbox"></TableCell>
                          <TableCell>
                            {indexOfFirstEmployee + index + 1}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                cursor: "pointer",
                                "&:hover": {
                                  color: "#009688",
                                },
                              }}
                              onClick={(e) => handleEmployeeClick(e, employee)}
                            >
                              {employee.avatar ? (
                                <Avatar
                                  src={employee.avatar}
                                  sx={{ width: 36, height: 36 }}
                                />
                              ) : (
                                <Avatar
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: "#3DC296",
                                  }}
                                >
                                  {getInitials(employee.name)}
                                </Avatar>
                              )}
                              {employee.name}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  employee.department === "N/A"
                                    ? "text.secondary"
                                    : "text.primary",
                                fontStyle:
                                  employee.department === "N/A"
                                    ? "italic"
                                    : "normal",
                              }}
                            >
                              {employee.department}
                            </Typography>
                          </TableCell>
                          <TableCell>{employee.comp}</TableCell>
                          <TableCell>{employee.hours}</TableCell>
                          <TableCell>{employee.overtime}</TableCell>
                        </TableRow>
                      );
                    })}
                    {currentEmployees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          {filteredEmployees.length === 0 ? (
                            searchTerm ? (
                              <Typography>
                                No employees found matching "{searchTerm}"
                              </Typography>
                            ) : (
                              <Typography>No employees found</Typography>
                            )
                          ) : (
                            <Typography>No employees on this page</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing {indexOfFirstEmployee + 1}-
                  {Math.min(indexOfLastEmployee, filteredEmployees.length)} from{" "}
                  {filteredEmployees.length}
                </Typography>
                <Pagination
                  count={Math.ceil(filteredEmployees.length / rowsPerPage)}
                  page={page}
                  onChange={handleChangePage}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            </>
          )}
        </Paper>
      )}

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={employees}
        title="Staff Payroll Data"
        filterType={currentFilter.filterType}
        selectedDate={currentFilter.selectedDate}
        selectedMonth={currentFilter.selectedMonth}
        selectedYear={currentFilter.selectedYear}
        payrollData={currentFilter.payrollData}
      />
    </Box>
  );
};

export default Payroll;
