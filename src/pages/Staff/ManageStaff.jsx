"use client";

import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import CustomButton from "../../ui_components/CustomButton.jsx";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

// Import Firebase
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { firestoreDb } from "../../config/firebase.jsx";
import { getAuth } from "firebase/auth";

const paginationModel = { page: 0, pageSize: 5 };

export default function ManageStaff() {
  const navigation = useNavigate();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState(null);
  const [currentAdmin, setCurrentAdmin] = React.useState(null);

  // Get the current admin user
  React.useEffect(() => {
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

  const confirmDelete = (firestoreId) => {
    setSelectedEmployeeId(firestoreId);
    setOpenDialog(true);
  };

  // Fetch employees from Firebase
  const fetchEmployees = async () => {
    try {
      if (!currentAdmin) return;

      setLoading(true);
      // Get employees from the main employees collection
      // Remove the filter by adminId to get all employees
      const employeesCollection = collection(firestoreDb, "employees");
      const employeeSnapshot = await getDocs(employeesCollection);

      const employeeList = employeeSnapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          id: (index + 1).toString(), // Sequential display ID
          firestoreId: doc.id, // Preserve original ID for edit/delete
          name: `${data.firstName} ${data.lastName}`,
          department: data.department || "Not specified",
          profileImageUrl: data.profileImageUrl || "",
          firstName: data.firstName,
          lastName: data.lastName,
          designation: data.designation || "Not specified",
          email: data.email,
          phoneNumber: data.phoneNumber,
          hourlyRate: data.hourlyRate,
          adminId: data.adminId, // Store the admin ID
        };
      });

      setRows(employeeList);
      setError(null);
    } catch (error) {
      console.error("Error fetching employees: ", error);
      setError("Failed to load employees. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load employees when admin data is available
  React.useEffect(() => {
    if (currentAdmin) {
      fetchEmployees();
    }
  }, [currentAdmin]);

  // Delete employee
  const handleConfirmDelete = async () => {
    try {
      if (!currentAdmin) {
        setError("Admin authentication required");
        return;
      }

      // Delete from the main employees collection
      await deleteDoc(doc(firestoreDb, "employees", selectedEmployeeId));
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee: ", error);
      setError("Failed to delete employee. Please try again.");
    } finally {
      setOpenDialog(false);
      setSelectedEmployeeId(null);
    }
  };

  // Get initials for the avatar fallback
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const columns = [
    { field: "id", headerName: "ID", width: 60 },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {params.row.profileImageUrl ? (
            <Avatar
              src={params.row.profileImageUrl}
              alt={params.value}
              sx={{ width: 48, height: 48 }}
            />
          ) : (
            <Avatar
              sx={{ width: 48, height: 48, bgcolor: "#3DC296" }}
              alt={params.value}
            >
              {getInitials(params.row.firstName, params.row.lastName)}
            </Avatar>
          )}
          {params.value}
        </div>
      ),
    },
    { field: "department", headerName: "Department", width: 150 },
    { field: "designation", headerName: "Designation", width: 150 },
    {
      field: "attendanceReport",
      headerName: "Attendance Report",
      width: 180,
      renderCell: (params) => (
        <div>
          <CustomButton
            style={"mt-5 w-[120px] text-white text-xs custom-view-details"}
            title={"View Details"}
            icon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
            onClick={() =>
              navigation(
                `/reports?id=${params.row.firestoreId}&adminId=${params.row.adminId}`
              )
            }
          />
        </div>
      ),
    },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <div style={{ flexDirection: "row", alignItems: "center" }}>
          <IconButton onClick={() => confirmDelete(params.row.firestoreId)}>
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-black">Staff Management</h2>
          <h4 className="mt-2 text-gray-600">Manage all staff here</h4>
        </div>
        <CustomButton
          title="Add A New Staff Member"
          style={"w-[230px] text-white h-10 add-staff-btn"}
          icon={<PersonAddOutlinedIcon />}
          onClick={() => navigation("/manage-staff/AddNewStaff")}
        />
      </div>

      <Paper sx={{ width: "100%", marginTop: 5, paddingLeft: 2 }}>
        <div className="flex justify-between items-center p-5 border-b border-[#dadada]">
          <h1 className="font-bold">Employees</h1>
          <button
            onClick={fetchEmployees}
            className="text-blue-500 refresh-btn"
          >
            Refresh
          </button>
        </div>

        {error && <div className="p-4 text-red-500">{error}</div>}

        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[5, 10, 25]}
          sx={{ border: 0 }}
          rowHeight={80}
          loading={loading}
        />
      </Paper>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this employee? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
