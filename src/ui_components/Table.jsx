import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { firestoreDb } from "../config/firebase";
import AddEmployeeForm from "../components/Form";

export default function EmployeePage() {
  const [rows, setRows] = useState([]);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(firestoreDb, "LatestAttendance"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setRows(data);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(firestoreDb, "employees", id));
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "name",
      headerName: "Name",
      width: 150,
      renderCell: (params) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={params.row.profilePic  || "https://via.placeholder.com/32"}
            alt={params.value}
            style={{ width: 32, height: 32, borderRadius: "50%" }}
          />
          {params.value}
        </div>
      ),
    },
    { field: "date", headerName: "Date", width: 120 },
    { field: "checkIn", headerName: "Check-in", width: 120 },
    { field: "checkOut", headerName: "Check-out", width: 120 },
    { field: "totalHours", headerName: "Total", width: 120 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <div
          style={{
            border: "1px solid #ccc",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {params.row.status}
        </div>
      ),
    },
    {
      field: "action",
      headerName: "Action",
      width: 80,
      renderCell: (params) => (
        <div style={{flexDirection:'row' , alignItems:"center" , gap:"5px"}}>
          <IconButton onClick={() => handleDelete(params.row.id)}>
          <DeleteIcon color="error" />
        </IconButton>
        <IconButton>
          <EditIcon />
        </IconButton>
        </div>
      ),
    },
  ];

  return (
    <Paper sx={{ padding: 2, height: "auto", width: "100%" }}>
      <AddEmployeeForm onAdded={fetchData} />
      <h1 className="p-5 font-bold border-b border-[#dadada]">Employees</h1>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        autoHeight
        sx={{ border: 0 }}
      />
    </Paper>
  );
}
