import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
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
  DialogTitle,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import { firestoreDb } from "../config/firebase";
import CustomButton from "../ui_components/CustomButton";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [departmentToEdit, setDepartmentToEdit] = useState(null);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("");
  const [editDepartmentName, setEditDepartmentName] = useState("");
  const [editDepartmentDescription, setEditDepartmentDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch all departments from Firestore
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const departmentsCollection = collection(firestoreDb, "departments");
      const departmentsQuery = query(departmentsCollection, orderBy("createdAt", "desc"));
      const departmentSnapshot = await getDocs(departmentsQuery);
      const departmentsList = departmentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDepartments(departmentsList);
      setFilteredDepartments(departmentsList);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get admin count for each department
  const getAdminCountForDepartment = async (departmentName) => {
    try {
      const adminsCollection = collection(firestoreDb, "admins");
      const adminSnapshot = await getDocs(adminsCollection);
      const adminsList = adminSnapshot.docs.map((doc) => doc.data());
      return adminsList.filter(admin =>
        admin.department && admin.department.toLowerCase() === departmentName.toLowerCase()
      ).length;
    } catch (error) {
      console.error("Error fetching admin count:", error);
      return 0;
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Filter departments based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = departments.filter(
        (dept) =>
          dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (dept.description && dept.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredDepartments(filtered);
    } else {
      setFilteredDepartments(departments);
    }
  }, [searchQuery, departments]);

  // Add new department
  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      alert("Department name is required");
      return;
    }

    // Check if department already exists
    const existingDept = departments.find(
      dept => dept.name.toLowerCase() === newDepartmentName.toLowerCase()
    );
    if (existingDept) {
      alert("Department with this name already exists");
      return;
    }

    try {
      setSubmitting(true);
      const departmentsCollection = collection(firestoreDb, "departments");
      const newDepartment = {
        name: newDepartmentName.trim(),
        description: newDepartmentDescription.trim() || "",
        createdAt: serverTimestamp(),
        isActive: true
      };

      const docRef = await addDoc(departmentsCollection, newDepartment);

      // Add to local state
      const departmentWithId = {
        id: docRef.id,
        ...newDepartment,
        createdAt: { seconds: Date.now() / 1000 }
      };

      setDepartments(prev => [departmentWithId, ...prev]);
      setFilteredDepartments(prev => [departmentWithId, ...prev]);

      // Reset form
      setNewDepartmentName("");
      setNewDepartmentDescription("");
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding department:", error);
      alert(`Failed to add department: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit department
  const handleEditClick = (department) => {
    setDepartmentToEdit(department);
    setEditDepartmentName(department.name);
    setEditDepartmentDescription(department.description || "");
    setEditDialogOpen(true);
  };

  const handleUpdateDepartment = async () => {
    if (!editDepartmentName.trim()) {
      alert("Department name is required");
      return;
    }

    // Check if another department has this name
    const existingDept = departments.find(
      dept => dept.name.toLowerCase() === editDepartmentName.toLowerCase() &&
      dept.id !== departmentToEdit.id
    );
    if (existingDept) {
      alert("Department with this name already exists");
      return;
    }

    try {
      setSubmitting(true);
      const departmentDoc = doc(firestoreDb, "departments", departmentToEdit.id);
      const updateData = {
        name: editDepartmentName.trim(),
        description: editDepartmentDescription.trim() || "",
        updatedAt: serverTimestamp()
      };

      await updateDoc(departmentDoc, updateData);

      // Update local state
      const updatedDepartments = departments.map(dept =>
        dept.id === departmentToEdit.id
          ? { ...dept, ...updateData }
          : dept
      );

      setDepartments(updatedDepartments);
      setFilteredDepartments(updatedDepartments);

      setEditDialogOpen(false);
      setDepartmentToEdit(null);
    } catch (error) {
      console.error("Error updating department:", error);
      alert(`Failed to update department: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete department
  const handleDeleteClick = (department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      setSubmitting(true);

      // Check if any admins are assigned to this department
      const adminCount = await getAdminCountForDepartment(departmentToDelete.name);
      if (adminCount > 0) {
        alert(`Cannot delete department. ${adminCount} admin(s) are assigned to this department. Please reassign them first.`);
        setSubmitting(false);
        return;
      }

      const departmentDoc = doc(firestoreDb, "departments", departmentToDelete.id);
      await deleteDoc(departmentDoc);

      // Remove from local state
      setDepartments(prev => prev.filter(dept => dept.id !== departmentToDelete.id));
      setFilteredDepartments(prev => prev.filter(dept => dept.id !== departmentToDelete.id));

      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    } catch (error) {
      console.error("Error deleting department:", error);
      alert(`Failed to delete department: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-800 flex items-center">
            <BusinessIcon sx={{ mr: 2, color: "#1976d2" }} />
            Department Management
          </h1>
          <p className="text-gray-500">Manage organizational departments</p>
        </div>
        <CustomButton
          title="Add New Department"
          icon={<AddIcon sx={{ mr: 1 }} />}
          style={"text-white px-4 py-2 flex items-center"}
          onClick={() => setAddDialogOpen(true)}
        />
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search departments by name or description..."
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

      {/* Department table */}
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="400px"
        >
          <CircularProgress />
        </Box>
      ) : filteredDepartments.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height="300px"
          sx={{ background: "white", borderRadius: "8px", border: "1px solid #e0e0e0" }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: "#bdbdbd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery
              ? "No departments found matching your search"
              : "No departments created yet"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {!searchQuery && "Click 'Add New Department' to get started"}
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
                <TableCell sx={{ fontWeight: "bold" }}>Department Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDepartments.map((department) => (
                <TableRow key={department.id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                      {department.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {department.description || "No description"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={department.isActive ? "Active" : "Inactive"}
                      color={department.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {department.createdAt
                      ? new Date(
                          department.createdAt.seconds * 1000
                        ).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Tooltip title="Edit Department">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(department)}
                        >
                          <EditIcon className="text-blue-600" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Department">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(department)}
                        >
                          <DeleteIcon className="text-red-600" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Department Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            variant="outlined"
            value={newDepartmentName}
            onChange={(e) => setNewDepartmentName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newDepartmentDescription}
            onChange={(e) => setNewDepartmentDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAddDepartment}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "Add Department"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Department</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            variant="outlined"
            value={editDepartmentName}
            onChange={(e) => setEditDepartmentName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={editDepartmentDescription}
            onChange={(e) => setEditDepartmentDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateDepartment}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "Update Department"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the department "{departmentToDelete?.name}"?
            This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: You cannot delete a department that has admins assigned to it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteDepartment}
            color="error"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DepartmentManagement;