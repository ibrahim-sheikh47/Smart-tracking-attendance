import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Paper,
  Avatar,
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
  Checkbox,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  QrCode,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as ExportIcon,
} from "@mui/icons-material";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firestoreDb } from "../../config/firebase.jsx";
import InputField from "../../ui_components/InputField.jsx";
import assets from "../../constants/assets.jsx";
import AttendanceReportCard from "../../ui_components/AttendanceReportCard.jsx";
import AttendanceChart from "../../components/AttendanceChart.jsx";
import QrCodeDialog from "../../ui_components/QrDialog.jsx";

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

  // Get employee ID from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const employeeId = queryParams.get("id");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleOpenQrDialog = (employee) => {
    setSelectedEmployee(employee);
    setQrDialogOpen(true);
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
    setSelectedEmployee(null);
  };

  // Fetch employee data or all employees
  useEffect(() => {
    if (employeeId) {
      fetchSingleEmployee();
    } else {
      fetchAllEmployees();
    }
  }, [employeeId]);

  const fetchSingleEmployee = async () => {
    try {
      setLoading(true);
      const employeeDoc = await getDoc(
        doc(firestoreDb, "employees", employeeId)
      );

      if (employeeDoc.exists()) {
        const data = employeeDoc.data();
        setEmployee({
          ...data,
          id: employeeDoc.id,
          name: `${data.firstName} ${data.lastName}`,
        });
      } else {
        setError("Employee not found");
      }
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setError("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      setLoading(true);
      const employeesRef = collection(firestoreDb, "employees");
      const employeesSnapshot = await getDocs(employeesRef);

      const employeeList = [];

      for (const doc of employeesSnapshot.docs) {
        const data = doc.data();

        // Fetch attendance data for this employee
        const checkInsRef = collection(firestoreDb, "CheckIns");
        const checkInsQuery = query(checkInsRef, where("employeeId", "==", doc.id));
        const checkInsSnapshot = await getDocs(checkInsQuery);

        // Count present days
        const presentDays = checkInsSnapshot.size;

        // Calculate overtime (mock data for now)
        const overtime = Math.floor(Math.random() * 5); // Random 0-4 hours

        // Calculate leaves (mock data for now)
        const leaves = Math.floor(Math.random() * 3); // Random 0-2 leaves

        employeeList.push({
          id: doc.id,
          name: `${data.firstName} ${data.lastName}`,
          department: data.department || "Not specified",
          designation: data.designation || "Not specified",
          email: data.email,
          phoneNumber: data.phoneNumber,
          photoURL: data.photoURL,
          present: presentDays,
          leaves: leaves,
          overtime: `${overtime} hour${overtime !== 1 ? 's' : ''}`,
          status: "Present"
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

  const handleViewDetails = (id) => {
    navigate(`/reports?id=${id}`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = employees.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Get initials for the avatar fallback
  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return `${parts[0]?.charAt(0) || ""}${
      parts[1]?.charAt(0) || ""
    }`.toUpperCase();
  };

  const [selectedMonth, setSelectedMonth] = useState("");

  // Filter employees based on search query
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
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
      <div className="flex items-start gap-5 m-5">
        <div className="max-w-[400px] bg-[#F9F9F9] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <p>Person info</p>
            <button
              onClick={() => handleOpenQrDialog(employee)}
              className="border-2 text-sm border-black text-black px-4 py-2 rounded-lg font-bold cursor-pointer hover:scale-105"
            >
              <QrCode />
            </button>
          </div>

          <Divider sx={{ marginY: 2 }} />

          <div className=" mx-auto">
            {employee?.photoURL ? (
              <Avatar
                src={employee.photoURL}
                alt={employee.name}
                sx={{ width: 102, height: 102, marginRight: 2, marginX: "auto" }}
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
            </div>
            <InputField
              label={"Department"}
              value={employee?.department}
              disabled
            />
            <InputField
              label={"Designation"}
              value={employee?.designation}
              disabled
            />
            <InputField label={"Bio"} value={employee?.bio} disabled />
            <InputField label={"Email"} value={employee?.email} disabled />
            <InputField label={"Phone"} value={employee?.phoneNumber} disabled />
          </div>
        </div>

        <div className="flex-1">
          <div className=" bg-[#F9F9F9] p-4 rounded-2xl">
            <div className="flex justify-between items-center">
              <p>Attendance Report</p>
              <button
                className="border-2 text-sm border-[#3DC296] text-[#3DC296] px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-[#3DC296] hover:text-white"
                onClick={() => handleViewHistory(employeeId)}
              >
                View History
              </button>
            </div>

            <Divider sx={{ marginY: 3 }} />

            <div className="grid grid-rows-2 grid-cols-2 gap-4">
              <AttendanceReportCard
                title={"Total Present"}
                value={90}
                style={"bg-[#3DC29610] border-2 border-[#3DC296]"}
                icon={assets.presentIcon}
              />
              <AttendanceReportCard
                title={"Total Leaves"}
                value={10}
                style={"bg-[#EC091B1A] border-2 border-[#EC091B]"}
                icon={assets.leavesIcon}
              />
              <AttendanceReportCard
                title={"On Time"}
                value={"70%"}
                style={"bg-[#00A2FF1A] border-2 border-[#00A2FF]"}
                icon={assets.onTimeIcon}
              />
              <AttendanceReportCard
                title={"Over Time"}
                value={"10 min"}
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
                    Overview of attendance of all staffs.
                  </p>
                </div>
                <InputField
                  dropdown={true}
                  value={selectedMonth}
                  options={options}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
              <Divider sx={{ marginY: 2 }} />
              <AttendanceChart data={data} />
            </div>
          </div>
        </div>
        {/* QR Code Dialog */}
        <QrCodeDialog
          open={qrDialogOpen}
          onClose={handleCloseQrDialog}
          employee={selectedEmployee}
        />
      </div>
    );
  }

  // If no employeeId is provided, show all employees report
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
            backgroundColor: '#3DC296',
            '&:hover': { backgroundColor: '#2ea37b' }
          }}
        >
          Export All
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="medium">
            Employees Reports
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < employees.length}
                    checked={employees.length > 0 && selected.length === employees.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Present</TableCell>
                <TableCell>Leaves</TableCell>
                <TableCell>Overtime</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee, index) => {
                  const isItemSelected = isSelected(employee.id);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={employee.id}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(event) => handleClick(event, employee.id)}
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={employee.photoURL}
                            alt={employee.name}
                            sx={{ width: 36, height: 36, mr: 2 }}
                          >
                            {getInitials(employee.name)}
                          </Avatar>
                          <Typography variant="body2">{employee.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.present}</TableCell>
                      <TableCell>{employee.leaves}</TableCell>
                      <TableCell>{employee.overtime}</TableCell>
                      <TableCell>
                        <Chip
                          label="Present"
                          size="small"
                          sx={{
                            backgroundColor: '#E6F7F1',
                            color: '#3DC296',
                            fontWeight: 'medium',
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Delete">
                            <IconButton size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(employee.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
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
        <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {page * rowsPerPage + 1}-
            {Math.min((page + 1) * rowsPerPage, filteredEmployees.length)} from {filteredEmployees.length}
          </Typography>
        </Box>
      </Paper>
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

// Sample data for the chart
const data = [
  { name: "Jan", presents: 2000, lateArrivals: 400, absents: 300 },
  { name: "Feb", presents: 1800, lateArrivals: 300, absents: 250 },
  { name: "Mar", presents: 2200, lateArrivals: 500, absents: 350 },
  { name: "Apr", presents: 1900, lateArrivals: 450, absents: 280 },
  { name: "May", presents: 2100, lateArrivals: 380, absents: 320 },
  { name: "June", presents: 2300, lateArrivals: 420, absents: 290 },
  { name: "July", presents: 1950, lateArrivals: 350, absents: 310 },
  { name: "Aug", presents: 2050, lateArrivals: 400, absents: 330 },
  { name: "Sep", presents: 2150, lateArrivals: 430, absents: 340 },
  { name: "Oct", presents: 2250, lateArrivals: 470, absents: 360 },
  { name: "Nov", presents: 2350, lateArrivals: 490, absents: 380 },
  { name: "Dec", presents: 2450, lateArrivals: 510, absents: 400 },
];