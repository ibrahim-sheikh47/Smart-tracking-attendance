import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  InputAdornment,
  TextField,
  Button,
  Avatar,
  Pagination,
  Stack,
  Chip,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CustomButton from "../../ui_components/CustomButton";
import { useNavigate } from "react-router-dom";

const Payroll = () => {

  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for employees
  const employees = [
    {
      id: 1,
      name: "Stella Jason",
      comp: "D 3.5",
      hours: "40 hours",
      overtime: "1 hour 20 mins",
      status: "Present",
      avatar: "/assets/avatar1.jpg",
    },
    {
      id: 2,
      name: "Hannah Baker",
      comp: "D 3.5",
      hours: "40 hours",
      overtime: "1 hour 20 mins",
      status: "Present",
      avatar: "/assets/avatar2.jpg",
    },
    {
      id: 3,
      name: "Harper John",
      comp: "D 3.5",
      hours: "40 hours",
      overtime: "1 hour 20 mins",
      status: "Present",
      avatar: "/assets/avatar3.jpg",
    },
    {
      id: 4,
      name: "Jessica Willson",
      comp: "D 3.5",
      hours: "40 hours",
      overtime: "1 hour 20 mins",
      status: "Present",
      avatar: "/assets/avatar4.jpg",
    },
    {
      id: 5,
      name: "Harlin Watson",
      comp: "D 3.5",
      hours: "40 hours",
      overtime: "1 hour 20 mins",
      status: "Present",
      avatar: "/assets/avatar5.jpg",
    },
    {
      id: 6,
      name: "Jessica Willson",
      comp: "D 3.5",
      hours: "40 hours",
      overtime: "1 hour 20 mins",
      status: "Present",
      avatar: "/assets/avatar4.jpg",
    },
    {
      id: 7,
      name: "Harper John",
      comp: "D 3.5",
      hours: "40 hours",
      overtime: "1 hour 20 mins",
      status: "Present",
      avatar: "/assets/avatar3.jpg",
    },
    {
      id: 8,
      name: "Stella Jason",
      comp: "D 3.5",
      hours: "40 hours",
      overtime: "1 hour 20 mins",
      status: "Present",
      avatar: "/assets/avatar1.jpg",
    },
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Staff Payroll
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage all payrolls here.
            </Typography>
          </Box>
          <CustomButton
                title={"Export All"}
                style={"text-white w-[110px] h-[40px]"}
            />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Employees Reports
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              placeholder="Search..."
              size="small"
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 220 }}
            />

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                displayEmpty
                value="10"
                renderValue={() => "Show: 10"}
                IconComponent={KeyboardArrowDownIcon}
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="25">25</MenuItem>
                <MenuItem value="50">50</MenuItem>
                <MenuItem value="100">100</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f9f9f9" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Employee Name</TableCell>
                <TableCell>Comp/Hour</TableCell>
                <TableCell>Hours/wk</TableCell>
                <TableCell>Overtime</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#009688'
                        }
                      }}
                      onClick={() => navigate(`/payroll/payroll-detail/${employee.id}`)}
                    >
                      <Avatar src={employee.avatar} sx={{ width: 36, height: 36 }} />
                      {employee.name}
                    </Box>
                  </TableCell>
                  <TableCell>{employee.comp}</TableCell>
                  <TableCell>{employee.hours}</TableCell>
                  <TableCell>{employee.overtime}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.status}
                      size="small"
                      sx={{
                        bgcolor: "white",
                        paddingX:1,
                        borderRadius:1,
                        "&::before": {
                          content: '""',
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#3DC296",
                          marginRight: "4px",
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing 1-{Math.min(employees.length, rowsPerPage)} from{" "}
            {employees.length}
          </Typography>
          <Pagination
            count={Math.ceil(employees.length / rowsPerPage)}
            page={page}
            onChange={handleChangePage}
            color="primary"
            shape="rounded"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default Payroll;
