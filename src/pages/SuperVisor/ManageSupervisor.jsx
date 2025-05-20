"use client"

import { useState, useEffect } from "react"
import CustomButton from "../../ui_components/CustomButton"
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined"
import { DataGrid } from "@mui/x-data-grid"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import Avatar from "@mui/material/Avatar"
import Paper from "@mui/material/Paper"
import { useNavigate } from "react-router-dom"
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore"
import { firestoreDb } from "../../config/firebase.jsx"
import CircularProgress from "@mui/material/CircularProgress"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import Button from "@mui/material/Button"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Snackbar from "@mui/material/Snackbar"
import Alert from "@mui/material/Alert"
import CloseIcon from "@mui/icons-material/Close"

const ManageSuperVisor = () => {
  const navigation = useNavigate()
  const [supervisors, setSupervisors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSupervisor, setSelectedSupervisor] = useState(null)
  const [assignedEmployees, setAssignedEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [supervisorToDelete, setSupervisorToDelete] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

  useEffect(() => {
    fetchSupervisors()
  }, [])

  const fetchSupervisors = async () => {
    try {
      setLoading(true)
      const supervisorsRef = collection(firestoreDb, "supervisors")
      const supervisorsSnapshot = await getDocs(supervisorsRef)

      // Create a new array with sequential display IDs
      const supervisorsList = supervisorsSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        displayId: index + 1, // Add a displayId field for showing sequential numbers
        ...doc.data(),
        name: `${doc.data().firstName || ""} ${doc.data().lastName || ""}`.trim(),
      }))

      setSupervisors(supervisorsList)
    } catch (error) {
      console.error("Error fetching supervisors:", error)
      setSnackbar({
        open: true,
        message: "Failed to load supervisors",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeesForSupervisor = async (supervisorId) => {
    try {
      setLoadingEmployees(true)
      const employeesRef = collection(firestoreDb, "employees")
      const q = query(employeesRef, where("supervisorId", "==", supervisorId))
      const employeesSnapshot = await getDocs(q)

      // Create a new array with sequential display IDs
      const employeesList = employeesSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        displayId: index + 1, // Add a displayId field for showing sequential numbers
        ...doc.data(),
        name: `${doc.data().firstName || ""} ${doc.data().lastName || ""}`.trim(),
      }))

      setAssignedEmployees(employeesList)
    } catch (error) {
      console.error("Error fetching employees:", error)
      setSnackbar({
        open: true,
        message: "Failed to load employees",
        severity: "error",
      })
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleViewEmployees = (supervisor) => {
    setSelectedSupervisor(supervisor)
    fetchEmployeesForSupervisor(supervisor.id)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedSupervisor(null)
    setAssignedEmployees([])
  }

  const handleDeleteClick = (supervisor) => {
    setSupervisorToDelete(supervisor)
    setConfirmDeleteOpen(true)
  }

  const handleDeleteSupervisor = async () => {
    try {
      if (!supervisorToDelete) return

      await deleteDoc(doc(firestoreDb, "supervisors", supervisorToDelete.id))

      // After deletion, refresh the list to update the sequential IDs
      await fetchSupervisors()

      setSnackbar({
        open: true,
        message: "Supervisor deleted successfully",
        severity: "success",
      })
    } catch (error) {
      console.error("Error deleting supervisor:", error)
      setSnackbar({
        open: true,
        message: "Failed to delete supervisor",
        severity: "error",
      })
    } finally {
      setConfirmDeleteOpen(false)
      setSupervisorToDelete(null)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
  }

  const columns = [
    {
      field: "displayId", // Use the displayId field instead of trying to calculate it
      headerName: "ID",
      width: 60,
    },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {params.row.profileImageUrl ? (
            <Avatar src={params.row.profileImageUrl} alt={params.value} sx={{ width: 48, height: 48 }} />
          ) : (
            <Avatar sx={{ width: 48, height: 48, bgcolor: "#3DC296" }} alt={params.value}>
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
      field: "details",
      headerName: "Details",
      width: 180,
      renderCell: (params) => (
       <CustomButton
  style={"mt-5 w-[120px] text-white text-xs view-employees-btn"}
  title={"View Employees"}
  onClick={() => handleViewEmployees(params.row)}
/>

      ),
    },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <IconButton onClick={() => handleDeleteClick(params.row)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ]

  return (
    <div className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-black">Supervisor Management</h2>
          <h4 className="mt-2 text-gray-600">Manage all supervisors here</h4>
        </div>
    <CustomButton
  title="Add A New Supervisor"
  style={"w-[230px] text-white h-10 add-supervisor-btn"}
  icon={<PersonAddOutlinedIcon />}
  onClick={() => navigation("/manage-supervisor/AddNewSupervisor")}
/>

      </div>

      <Paper sx={{ width: "100%", marginTop: 5, paddingLeft: 2 }}>
        <div className="flex justify-between items-center p-5 border-b border-[#dadada]">
          <h1 className="font-bold">Supervisors</h1>
       <button
  className="text-blue-500 refresh-supervisors-btn"
  onClick={fetchSupervisors}
>
  Refresh
</button>

        </div>

        {loading ? (
          <div className="flex justify-center items-center p-10">
            <CircularProgress />
          </div>
        ) : (
          <DataGrid
            rows={supervisors}
            columns={columns}
            pageSizeOptions={[5, 10, 25]}
            sx={{ border: 0 }}
            rowHeight={80}
            autoHeight
            getRowId={(row) => row.id} // Ensure we use the Firebase ID as the row identifier
          />
        )}
      </Paper>

      {/* Modal for viewing employees */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <div className="flex justify-between items-center">
            <span>Employees Assigned to {selectedSupervisor?.name}</span>
            <span className="font-semibold">Department : {selectedSupervisor?.department}</span>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          {loadingEmployees ? (
            <div className="flex justify-center items-center p-10">
              <CircularProgress />
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignedEmployees.length > 0 ? (
                    assignedEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.displayId}</TableCell>
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {employee.profileImageUrl ? (
                              <Avatar
                                src={employee.profileImageUrl}
                                alt={employee.name}
                                sx={{ width: 32, height: 32 }}
                              />
                            ) : (
                              <Avatar sx={{ width: 32, height: 32, bgcolor: "#3DC296" }} alt={employee.name}>
                                {getInitials(employee.firstName, employee.lastName)}
                              </Avatar>
                            )}
                            {employee.name}
                          </div>
                        </TableCell>
                        <TableCell>{employee.designation || "N/A"}</TableCell>
                        <TableCell>{employee.email || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No employees assigned to this supervisor
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete supervisor {supervisorToDelete?.name}? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteSupervisor} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default ManageSuperVisor
