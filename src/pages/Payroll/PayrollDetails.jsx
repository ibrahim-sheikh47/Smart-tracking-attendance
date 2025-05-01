import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Button,
  IconButton,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WorkIcon from "@mui/icons-material/Work";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PaidIcon from "@mui/icons-material/Paid";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "@mui/icons-material";
import CustomButton from "../../ui_components/CustomButton";

const PayrollDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [totalCompExpanded, setTotalCompExpanded] = useState(false);
  const [overtimeExpanded, setOvertimeExpanded] = useState(false);

  // Mock employee data - in a real app, you'd fetch this based on id
  const employee = {
    id: id || "123456",
    name: "Jerry Williams",
    title: "UX/UI Designer",
    avatar: "/assets/avatar1.jpg",
    status: "Active",
    email: "johndoe@email.com",
    department: "Design",
    phone: "+1 234 23456",
    totalHours: "240 hours",
    workingHours: "250 hours",
    overTime: "4 hours",
    hourlyRate: "D 3.5",
    salary: "D 945",
    totalCompensation: "D 875",
    overtimePay: "D 70",
    compDetails: {
      compPerHour: "D 3.5",
      hoursPerWeek: "40 hours",
      hoursPerMonth: "240 hours",
      calculation: "3.5 x 240",
    },
    overtimeDetails: {
      compPerHour: "D 3.5 x 2",
      hoursPerWeek: "1 hours",
      hoursPerMonth: "10 hours",
      calculation: "3.5 x 2 x 10",
    },
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Header with Back Button and Export */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "start" }}>
            <IconButton onClick={() => navigate("/payroll")} sx={{ mr: 1 }}>
              <ChevronLeft />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {employee.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                EMP: #{employee.id}
              </Typography>
            </Box>
          </Box>
          <CustomButton
            title={"Export"}
            style={"text-white w-[110px] h-[40px]"}
          />
        </Box>

        {/* Employee Profile */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            gap: 3,
            backgroundColor: "#F9F9F9",
            padding: 3,
            borderRadius: 3,
          }}
        >
          <Avatar
            src={employee.avatar}
            sx={{
              width: 120,
              height: 120,
              border: "3px solid #f5f5f5",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              borderRadius: 3,
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {employee.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {employee.title}
            </Typography>

            <div className="flex justify-between gap-20">

              <div className="">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{employee.status}</p>
              </div>
              <div className="">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{employee.email}</p>
              </div>
              <div className="">
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{employee.department}</p>
              </div>
              <div className="">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{employee.phone}</p>
              </div>
            </div>
          </Box>
        </Box>

        {/* Hours and Rate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 w-full">
          <div className="bg-gray-100 p-4 shadow-sm rounded-md h-full">
            <div className="flex items-center mb-2">
              <AccessTimeIcon className="text-gray-600 mr-2" fontSize="small" />
              <p className="text-sm text-gray-500">Total Hours</p>
            </div>
            <p className="text-lg font-bold">{employee.totalHours}</p>
          </div>

          <div className="bg-gray-100 p-4 shadow-sm rounded-md h-full">
            <div className="flex items-center mb-2">
              <WorkIcon className="text-gray-600 mr-2" fontSize="small" />
              <p className="text-sm text-gray-500">Working Hours</p>
            </div>
            <div className="flex items-center">
              <p className="text-lg font-bold">{employee.workingHours}</p>
              <CheckCircleIcon
                className="text-teal-600 ml-2"
                fontSize="small"
              />
            </div>
          </div>

          <div className="bg-gray-100 p-4 shadow-sm rounded-md h-full">
            <div className="flex items-center mb-2">
              <ScheduleIcon className="text-gray-600 mr-2" fontSize="small" />
              <p className="text-sm text-gray-500">Over Time</p>
            </div>
            <p className="text-lg font-bold">{employee.overTime}</p>
          </div>

          <div className="bg-gray-100 p-4 shadow-sm rounded-md h-full">
            <div className="flex items-center mb-2">
              <PaidIcon className="text-gray-600 mr-2" fontSize="small" />
              <p className="text-sm text-gray-500">Hourly Rate</p>
            </div>
            <div className="flex items-center">
              <p className="text-lg font-bold">{employee.hourlyRate}</p>
              <CheckCircleIcon
                className="text-teal-600 ml-2"
                fontSize="small"
              />
            </div>
          </div>
        </div>

        {/* Salary */}
        <Box
          sx={{
            border: "2px solid #3DC296",
            borderRadius: 2,
            background:"#3DC29610",
            p: 2,
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ color: "#00000080" }}>Salary</Typography>
          <Typography variant="h6" fontWeight="bold">
            {employee.salary}
          </Typography>
        </Box>

        {/* Total Compensation */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#f9f9f9",
              p: 2,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              cursor: "pointer",
            }}
            onClick={() => setTotalCompExpanded(!totalCompExpanded)}
          >
            <Typography sx={{ color: "#00000080" }}>Total Compensation</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                {employee.totalCompensation}
              </Typography>
              {totalCompExpanded ? (
                <KeyboardArrowUpIcon />
              ) : (
                <KeyboardArrowDownIcon />
              )}
            </Box>
          </Box>
          <Collapse in={totalCompExpanded} timeout="auto" unmountOnExit>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ borderTop: "none" }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Comp/Hour</TableCell>
                    <TableCell>Hours/wk</TableCell>
                    <TableCell>Hours/Month</TableCell>
                    <TableCell>Comp x Hours/Month</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{employee.compDetails.compPerHour}</TableCell>
                    <TableCell>{employee.compDetails.hoursPerWeek}</TableCell>
                    <TableCell>{employee.compDetails.hoursPerMonth}</TableCell>
                    <TableCell>{employee.compDetails.calculation}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Box>

        {/* Overtime */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#f9f9f9",
              p: 2,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              cursor: "pointer",
            }}
            onClick={() => setOvertimeExpanded(!overtimeExpanded)}
          >
            <Typography sx={{ color: "#00000080" }}>Overtime</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                {employee.overtimePay}
              </Typography>
              {overtimeExpanded ? (
                <KeyboardArrowUpIcon />
              ) : (
                <KeyboardArrowDownIcon />
              )}
            </Box>
          </Box>
          <Collapse in={overtimeExpanded} timeout="auto" unmountOnExit>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ borderTop: "none" }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Comp/Hour</TableCell>
                    <TableCell>Hours/wk</TableCell>
                    <TableCell>Hours/Month</TableCell>
                    <TableCell>Comp x Hours/Month</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      {employee.overtimeDetails.compPerHour}
                    </TableCell>
                    <TableCell>
                      {employee.overtimeDetails.hoursPerWeek}
                    </TableCell>
                    <TableCell>
                      {employee.overtimeDetails.hoursPerMonth}
                    </TableCell>
                    <TableCell>
                      {employee.overtimeDetails.calculation}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Box>
      </Paper>
    </Box>
  );
};

export default PayrollDetail;
