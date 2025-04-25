import * as React from "react";
import { DataGrid, GridArrowUpwardIcon } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import assets from "../../constants/assets.jsx";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import CustomButton from "../../ui_components/CustomButton.jsx";
import { useNavigate } from "react-router-dom";

const initialRows = [
  {
    id: 1,
    name: "Ali",
    department: "Accounts",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 2,
    name: "Ibrahim",
    department: "Business Admins",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 3,
    name: "Umer",
    department: "Developers",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 4,
    name: "Usman",
    department: "Accounts",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 5,
    name: "Abubakar",
    department: "Business Admins",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 6,
    name: "Zubair",
    department: "Developers",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 7,
    name: "Hamza",
    department: "Accounts",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 8,
    name: "Nauman",
    department: "Business Admins",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 9,
    name: "Saud",
    department: "Accounts",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
];

const paginationModel = { page: 0, pageSize: 5 };

export default function ManageStaff() {
  const navigation = useNavigate();
  const [rows, setRows] = React.useState(initialRows);

  const handleDelete = (id) => {
    const updatedRows = rows.filter((row) => row.id !== id);
    setRows(updatedRows);
  };

  const columns = [
    { field: "id", headerName: "ID", width: 100 },
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
    { field: "department", headerName: "Department", width: 200 },
    {
      field: "status",
      headerName: "Status",
      width: 180,
    },
    {
      field: "attendanceReport",
      headerName: "Attendance Report",
      width: 220,
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
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <div style={{ flexDirection: "row", alignItems: "center", gap: "" }}>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
          <IconButton>
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
        <h1 className="p-5 font-bold border-b border-[#dadada]">Employees</h1>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[5, 10]}
          checkboxSelection
          sx={{ border: 0 }}
          rowHeight={80}
        />
      </Paper>
    </div>
  );
}
