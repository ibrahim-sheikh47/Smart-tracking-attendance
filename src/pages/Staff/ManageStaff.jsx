import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import assets from "../../constants/assets.jsx";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import CustomButton from "../../ui_components/CustomButton.jsx";
import { useNavigate } from "react-router-dom";
// Import Firebase
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import {firestoreDb} from "../../config/firebase.jsx";

const paginationModel = { page: 0, pageSize: 5 };

export default function ManageStaff() {
  const navigation = useNavigate();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Fetch employees from Firebase
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const employeesCollection = collection(firestoreDb, "employees");
      const employeeSnapshot = await getDocs(employeesCollection);

      const employeeList = employeeSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: `${data.firstName} ${data.lastName}`,
          department: data.department,
          status: "Present", // Default status or could be from another field
          image: assets.dp1, // Default image or could be from another field
          designation: data.designation,
          email: data.email,
          phoneNumber: data.phoneNumber,
          hourlyRate: data.hourlyRate
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

  // Load employees on component mount
  React.useEffect(() => {
    fetchEmployees();
  }, []);

  // Delete employee
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "employees", id));
      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee: ", error);
      alert("Failed to delete employee. Please try again.");
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 220 },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
                src={params.row.image}
                alt={params.value}
                style={{ width: 32, height: 32, borderRadius: "50%" }}
            />
            {params.value}
          </div>
      ),
    },
    { field: "department", headerName: "Department", width: 150 },
    { field: "designation", headerName: "Designation", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
    },
    {
      field: "attendanceReport",
      headerName: "Attendance Report",
      width: 180,
      renderCell: () => (
          <div>
            <CustomButton
                style={"mt-5 w-[120px] text-white text-xs hover:bg-gray-700"}
                title={"View Report"}
                icon={<OpenInNewIcon sx={{fontSize:16}}/>}
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
            <IconButton onClick={() => handleDelete(params.row.id)}>
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={() => navigation(`/manage-staff/edit/${params.row.id}`)}>
              <EditIcon />
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
              style={"w-[230px] text-white h-10 hover:bg-gray-700"}
              icon={<PersonAddOutlinedIcon />}
              onClick={() => navigation("/manage-staff/AddNewStaff")}
          />
        </div>

        <Paper sx={{ height: 500, width: "100%", marginTop: 5 }}>
          <div className="flex justify-between items-center p-5 border-b border-[#dadada]">
            <h1 className="font-bold">Employees</h1>
            <button
                onClick={fetchEmployees}
                className="text-blue-500 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>

          {error && (
              <div className="p-4 text-red-500">
                {error}
              </div>
          )}

          <DataGrid
              rows={rows}
              columns={columns}
              initialState={{ pagination: { paginationModel } }}
              pageSizeOptions={[5, 10, 25]}
              checkboxSelection
              sx={{ border: 0 }}
              rowHeight={80}
              loading={loading}
          />
        </Paper>
      </div>
  );
}