import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Paper,
  Avatar,
  Typography,
  Box,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, QrCode } from "@mui/icons-material";
import { doc, getDoc } from "firebase/firestore";
import { firestoreDb } from "../../config/firebase.jsx";
import InputField from "../../ui_components/InputField.jsx";
import AttendanceReportCard from "../../ui_components/AttendanceReportCard.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import assets from "../../constants/assets.jsx";

export default function Reports() {
  const location = useLocation();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get employee ID from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const employeeId = queryParams.get("id");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const handleOpenQrDialog = () => {
    setQrDialogOpen(true);
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
  };

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) {
        setError("No employee ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const employeeDoc = await getDoc(
          doc(firestoreDb, "employees", employeeId)
        );

        if (employeeDoc.exists()) {
          const data = employeeDoc.data();
          setEmployee({
            ...data,
            id: employeeDoc.id,
            name: `${data.firstName} ${data.lastName}`,
          });
        } else {
          setError("Employee not found");
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
        setError("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId]);

  const handleBack = () => {
    navigate("/manage-staff");
  };

  // Get initials for the avatar fallback
  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return `${parts[0]?.charAt(0) || ""}${
      parts[1]?.charAt(0) || ""
    }`.toUpperCase();
  };

  const [selectedMonth, setSelectedMonth] = useState("");

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Typography variant="h6">Loading employee data...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <button
          onClick={handleBack}
          className="mt-5 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
        >
          <ArrowBackIcon className="mr-2" />
          Back to Staff Management
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-5 m-5">
      <div className="max-w-[400px] bg-[#F9F9F9] p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <p>Person info</p>
          <button onClick={handleOpenQrDialog} className="border-2 text-sm border-black text-black px-4 py-2 rounded-lg font-bold cursor-pointer hover:scale-105">
            <QrCode/>
          </button>
        </div>

        <Divider sx={{ marginY: 2 }} />

        <div className=" mx-auto">
          {employee?.profileImageUrl ? (
            <Avatar
              src={employee.profileImageUrl}
              alt={employee.name}
              sx={{ width: 102, height: 102, marginRight: 2, marginX: "auto" }}
            />
          ) : (
            <Avatar
              sx={{
                width: 102,
                height: 102,
                marginRight: 2,
                marginX: "auto",
                borderRadius: 3,
              }}
              alt={employee?.name}
            >
              {getInitials(employee?.name)}
            </Avatar>
          )}
        </div>

        <div className="flex flex-col gap-7 mt-5">
          <div className="flex gap-3 mt-5">
            <InputField
              label={"First Name"}
              value={employee?.firstName}
              disabled
            />
            <InputField
              label={"Last Name"}
              value={employee?.lastName}
              disabled
            />
          </div>
          <InputField
            label={"Department"}
            value={employee?.department}
            disabled
          />
          <InputField
            label={"Designation"}
            value={employee?.designation}
            disabled
          />
          <InputField label={"Bio"} value={employee?.bio} disabled />
          <InputField label={"Email"} value={employee?.email} disabled />
          <InputField label={"Phone"} value={employee?.phoneNumber} disabled />
        </div>
      </div>

      <div className="flex-1">
        <div className=" bg-[#F9F9F9] p-4 rounded-2xl">
          <div className="flex justify-between items-center">
            <p>Attendance Report</p>
            <button className="border-2 text-sm border-[#3DC296] text-[#3DC296] px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-[#3DC296] hover:text-white">
              View History
            </button>
          </div>

          <Divider sx={{ marginY: 3 }} />

          <div className="grid grid-rows-2 grid-cols-2 gap-4">
            <AttendanceReportCard
              title={"Total Present"}
              value={90}
              style={"bg-[#3DC29610] border-2 border-[#3DC296]"}
              icon={assets.presentIcon}
            />
            <AttendanceReportCard
              title={"Total Leaves"}
              value={10}
              style={"bg-[#EC091B1A] border-2 border-[#EC091B]"}
              icon={assets.leavesIcon}
            />
            <AttendanceReportCard
              title={"On Time"}
              value={"70%"}
              style={"bg-[#00A2FF1A] border-2 border-[#00A2FF]"}
              icon={assets.onTimeIcon}
            />
            <AttendanceReportCard
              title={"Over Time"}
              value={"10 min"}
              style={"bg-[#FFBB001A] border-2 border-[#FFBB00]"}
              icon={assets.overTimeIcon}
            />
          </div>
          <div className="bg-white p-4 mt-5 rounded-2xl">
            <div className="flex justify-between items-center">
              <div className="pt-2">
                <p className="text-lg font-bold text-[#24282E]">
                  Attendance Statistics
                </p>
                <p className="text-sm font-medium text-[#727A90]">
                  Overview of attendance of all staffs.
                </p>
              </div>
              <InputField
                dropdown={true}
                value={selectedMonth}
                options={options}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <Divider sx={{ marginY: 2 }} />
            <Paper className="p-6 rounded-lg">
              {/* Summary Stats */}
              <div className="flex justify-between mb-6">
                <div className="flex gap-3 items-center">
                  <div className="w-4 h-4 bg-[#3DC296] rounded-full" />
                  <p>Presents</p>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-4 h-4 bg-[#FEB924] rounded-full" />
                  <p>Late Arrivals</p>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-4 h-4 bg-[#E62E2E] rounded-full" />
                  <p>Absents</p>
                </div>
              </div>

              <Divider className="my-4" />

              {/* Bar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barSize={8}
                  >
                    <CartesianGrid strokeDasharray="2 2" vertical={false} />
                    <XAxis dataKey="name" style={{ fontSize: "12px" }} />
                    <YAxis
                      domain={[0, 2500]}
                      ticks={[0, 500, 1000, 1500, 2000, 2500]}
                      tickFormatter={(value) => `${value / 1000}k`}
                      style={{ fontSize: "12px" }}
                    />
                    <Tooltip
                      labelStyle={{ color: "black", fontWeight: "bold" }}
                      formatter={(value, name) => [`${value}`, name]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar
                      dataKey="presents"
                      fill="#3DC296"
                      radius={[4, 4, 0, 0]}
                      name="Presents"
                    />
                    <Bar
                      dataKey="lateArrivals"
                      fill="#FEB924"
                      radius={[4, 4, 0, 0]}
                      name="Late Arrivals"
                    />
                    <Bar
                      dataKey="absents"
                      fill="#E62E2E"
                      radius={[4, 4, 0, 0]}
                      name="Absents"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Divider className="my-4" />
            </Paper>
          </div>
        </div>
      </div>
      {/* QR Code Dialog */}
<Dialog open={qrDialogOpen} onClose={handleCloseQrDialog}>
  <DialogTitle>{employee?.name}</DialogTitle>
  <DialogContent>
    {employee?.qrCodeUrl ? (
      <img
        src={employee.qrCodeUrl}
        alt={`${employee.name}'s QR Code`}
        style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
      />
    ) : (
      <Typography variant="body1" color="textSecondary">
        No QR code available for this employee.
      </Typography>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseQrDialog} color="primary">
      Close
    </Button>
    {employee?.qrCodeUrl && (
      <Button
        onClick={() => {
          // Create a temporary anchor element to download the QR code
          const link = document.createElement('a');
          link.href = employee.qrCodeUrl;
          link.download = `qr-code-${employee.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
        color="primary"
      >
        Download
      </Button>
    )}
  </DialogActions>
</Dialog>
    </div>
  );
}

const options = [
  { value: "January", label: "January" },
  { value: "February", label: "February" },
  { value: "March", label: "March" },
  { value: "April", label: "April" },
  { value: "May", label: "May" },
  { value: "June", label: "June" },
  { value: "July", label: "July" },
  { value: "August", label: "August" },
  { value: "September", label: "September" },
  { value: "October", label: "October" },
  { value: "November", label: "November" },
  { value: "December", label: "December" },
];
// Sample data for the chart
const data = [
  { name: "Jan", presents: 2000, lateArrivals: 400, absents: 300 },
  { name: "Feb", presents: 1800, lateArrivals: 300, absents: 250 },
  { name: "Mar", presents: 2200, lateArrivals: 500, absents: 350 },
  { name: "Apr", presents: 1900, lateArrivals: 450, absents: 280 },
  { name: "May", presents: 2100, lateArrivals: 380, absents: 320 },
  { name: "June", presents: 2300, lateArrivals: 420, absents: 290 },
  { name: "July", presents: 1950, lateArrivals: 350, absents: 310 },
  { name: "Aug", presents: 2050, lateArrivals: 400, absents: 330 },
  { name: "Sep", presents: 2150, lateArrivals: 430, absents: 340 },
  { name: "Oct", presents: 2250, lateArrivals: 470, absents: 360 },
  { name: "Nov", presents: 2350, lateArrivals: 490, absents: 380 },
  { name: "Dec", presents: 2450, lateArrivals: 510, absents: 400 },
];

