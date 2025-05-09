// import React, { useEffect, useState } from "react";
// import { DataGrid } from "@mui/x-data-grid";
// import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
// import Paper from "@mui/material/Paper";
// import IconButton from "@mui/material/IconButton";
// import DeleteIcon from "@mui/icons-material/Delete";
// import EditIcon from "@mui/icons-material/Edit";
// import { firestoreDb } from "../config/firebase";

// export default function EmployeePage() {
//   const [rows, setRows] = useState([]);

//   const fetchData = async () => {
//     const snapshot = await getDocs(collection(firestoreDb, "employees"));
//     const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//     setRows(data);
//   };

//   const handleDelete = async (id) => {
//     await deleteDoc(doc(firestoreDb, "Movies", id));
//     fetchData();
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const columns = [
//     { field: "id", headerName: "ID", width: 90 },
//     {
//       field: "name",
//       headerName: "Name",
//       width: 150,
//       renderCell: (params) => (
//         <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//           <img
//             src={params.row.profilePic || "https://via.placeholder.com/32"}
//             alt={params.value}
//             style={{ width: 32, height: 32, borderRadius: "50%" }}
//           />
//           {params.value}
//         </div>
//       ),
//     },
//     { field: "date", headerName: "Date", width: 120 },
//     { field: "checkIn", headerName: "Check-in", width: 120 },
//     { field: "checkOut", headerName: "Check-out", width: 120 },
//     { field: "totalHours", headerName: "Total", width: 120 },
//     {
//       field: "status",
//       headerName: "Status",
//       width: 100,
//       renderCell: (params) => (
//         <div
//           style={{
//             border: "1px solid #ccc",
//             padding: "2px 6px",
//             borderRadius: "4px",
//           }}
//         >
//           {params.row.status}
//         </div>
//       ),
//     },
//     {
//       field: "action",
//       headerName: "Action",
//       width: 80,
//       renderCell: (params) => (
//         <div style={{ flexDirection: "row", alignItems: "center", gap: "5px" }}>
//           <IconButton onClick={() => handleDelete(params.row.id)}>
//             <DeleteIcon color="error" />
//           </IconButton>
//           <IconButton>
//             <EditIcon />
//           </IconButton>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <Paper sx={{ padding: 2, height: "auto", width: "100%" }}>
//       <h1 className="p-5 font-bold border-b border-[#dadada]">Employees</h1>
//       <DataGrid
//         rows={rows}
//         columns={columns}
//         pageSizeOptions={[5, 10]}
//         checkboxSelection
//         autoHeight
//         sx={{ border: 0 }}
//       />
//     </Paper>
//   );
// }

import React, { useState } from "react";
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
} from "@mui/material";
import { Search } from "@mui/icons-material";

const EmployeeTable = ({
  staffList = [],
  checkIns = [],
  absents = [],
  loading = false,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Get attendance status for an employee
  const getAttendanceStatus = (employeeId) => {
    const checkIn = checkIns.find((record) => record.employeeId === employeeId);

    if (checkIn) {
      const checkInTime = checkIn.checkInTime?.toDate();
      if (!checkInTime) return { status: "Present", color: "success" };

      const cutoffTime = new Date(checkInTime);
      cutoffTime.setHours(9, 0, 0, 0); // 9:00 AM cutoff

      if (checkInTime > cutoffTime) {
        return {
          status: "Late",
          color: "warning",
          time: checkInTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }

      return {
        status: "Present",
        color: "success",
        time: checkInTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    }

    return { status: "Absent", color: "error" };
  };

  // Filter employees based on search term
  const filteredStaff = staffList.filter(
    (employee) =>
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate the filtered results
  const paginatedStaff = filteredStaff.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="employee table">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Department</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Designation</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Today's Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Check-in Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} sx={{ color: "#4CAF50" }} />
                  <p className="mt-2">Loading employee data...</p>
                </TableCell>
              </TableRow>
            ) : paginatedStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              paginatedStaff.map((employee) => {
                const attendanceStatus = getAttendanceStatus(employee.uid);

                return (
                  <TableRow key={employee.uid}>
                    <TableCell>
                    
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>
                      <Chip
                        label={attendanceStatus.status}
                        color={attendanceStatus.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{attendanceStatus.time || "N/A"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredStaff.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default EmployeeTable;
