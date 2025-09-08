import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Link } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress,
} from "@mui/material";
import { firestoreDb, functions } from "./config/firebase";
import CustomButton from "./ui_components/CustomButton";

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [superAdmin, setSuperAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all admins from Firestore
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const adminsCollection = collection(firestoreDb, "admins");
      const adminSnapshot = await getDocs(adminsCollection);
      const adminsList = adminSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const superAdminData = adminsList.find((admin) => admin.isSuper);
      const adminOnlyList = adminsList.filter((admin) => !admin.isSuper);

      setSuperAdmin(superAdminData);
      setAdmins(adminOnlyList);
      setFilteredAdmins(adminOnlyList);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Filter admins based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = admins.filter(
        (admin) =>
          admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          admin.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAdmins(filtered);
    } else {
      setFilteredAdmins(admins);
    }
  }, [searchQuery, admins]);

  // Handle delete admin confirmation dialog
  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  // Delete admin from Firebase and Firestore
  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;

    try {
      setDeleteLoading(true);
      const deleteAdmin = httpsCallable(functions, "deleteAdmin");
      await deleteAdmin({ uid: adminToDelete.id });

      setAdmins((prevAdmins) =>
        prevAdmins.filter((admin) => admin.id !== adminToDelete.id)
      );
      setFilteredAdmins((prevFiltered) =>
        prevFiltered.filter((admin) => admin.id !== adminToDelete.id)
      );

      setDeleteDialogOpen(false);
      setAdminToDelete(null);
    } catch (error) {
      console.error("Error deleting admin:", error);
      alert(`Failed to delete admin: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-800">
            Admin Management
          </h1>
          <p className="text-gray-500">Manage system administrators</p>
        </div>
        <Link to="/admin-management/add-new-admin">
          <CustomButton
            title="Add New Admin"
            icon={<AddIcon sx={{ mr: 1 }} />}
            style={"bg-blue-600 text-white px-4 py-2 flex items-center"}
          />
        </Link>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search admins by name, email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ background: "white" }}
        />
      </div>

      {/* Admin table */}
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="400px"
        >
          <CircularProgress />
        </Box>
      ) : filteredAdmins.length === 0 ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="200px"
          sx={{ background: "white", borderRadius: "8px" }}
        >
          <Typography variant="h6" color="text.secondary">
            {searchQuery
              ? "No admins found matching your search"
              : "No admins added yet"}
          </Typography>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "#f3f4f6" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id} hover>
                  <TableCell>
                    {admin.firstName} {admin.lastName}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Admin
                    </span>
                  </TableCell>
                  <TableCell>
                    {admin.createdAt
                      ? new Date(
                          admin.createdAt.seconds * 1000
                        ).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <DeleteIcon
                        className="text-red-600 cursor-pointer"
                        onClick={() => handleDeleteClick(admin)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete admin {adminToDelete?.firstName}{" "}
            {adminToDelete?.lastName}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteAdmin}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminManagement;
