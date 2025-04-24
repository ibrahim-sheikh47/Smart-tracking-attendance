import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import assets from "../constants/assets";

const initialRows = [
  {
    id: 1,
    name: "Ali",
    date: "16/02/2025",
    checkIn: "05:05 PM",
    checkOut: "10:05 PM",
    totalHours: "8 Hrs",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 2,
    name: "Ibrahim",
    date: "16/03/2025",
    checkIn: "06:05 PM",
    checkOut: "10:05 PM",
    totalHours: "8 Hrs",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 3,
    name: "Umer",
    date: "16/04/2025",
    checkIn: "07:05 PM",
    checkOut: "10:05 PM",
    totalHours: "8 Hrs",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 4,
    name: "Usman",
    date: "16/05/2025",
    checkIn: "08:05 PM",
    checkOut: "10:05 PM",
    totalHours: "8 Hrs",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 5,
    name: "Abubakar",
    date: "16/01/2025",
    checkIn: "09:05 PM",
    checkOut: "10:05 PM",
    totalHours: "8 Hrs",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 6,
    name: "Zubair",
    date: "16/06/2025",
    checkIn: "10:05 PM",
    checkOut: "10:05 PM",
    totalHours: "8 Hrs",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 7,
    name: "Hamza",
    date: "16/07/2025",
    checkIn: "11:05 PM",
    checkOut: "10:05 PM",
    totalHours: "8 Hrs",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 8,
    name: "Nauman",
    date: "16/08/2025",
    checkIn: "05:05 PM",
    checkOut: "10:05 PM",
    totalHours: "8 Hrs",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
  {
    id: 9,
    name: "Saud",
    date: "16/09/2025",
    checkIn: "05:05 PM",
    checkOut: "10:05 PM",
    totalHours: "8 Hrs",
    status: "Present",
    action: "",
    image: assets.dp1,
  },
];

const paginationModel = { page: 0, pageSize: 5 };

export default function DataTable() {
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
    { field: "date", headerName: "Date", width: 150 },
    {
      field: "checkIn",
      headerName: "Check-in",
      width: 150,
    },
    {
      field: "checkOut",
      headerName: "Check-out",
      width: 150,
    },
    {
      field: "totalHours",
      headerName: "Total Hours",
      width: 150,
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
    },
    {
      field: "action",
      headerName: "Action",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <IconButton
            aria-label="edit"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="delete"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <Paper sx={{ height: 500, width: "100%" }}>
      <h1 className="p-5 font-bold border-b border-[#dadada]">Employees</h1>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        sx={{ border: 0 }}
      />
    </Paper>
  );
}
