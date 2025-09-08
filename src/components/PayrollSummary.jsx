"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Alert,
  TextField,
  InputLabel,
  Button,
} from "@mui/material";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { firestoreDb } from "../config/firebase.jsx";
import {
  differenceInMinutes,
  format,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfDay,
  endOfDay,
  parseISO,
} from "date-fns";

const PayrollSummary = ({ employees, loading, onFilterChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState("");
  const [filterType, setFilterType] = useState("monthly"); // 'daily' or 'monthly'
  const [payrollData, setPayrollData] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // Generate year options for the last 3 years
  const yearOptions = Array.from(
    { length: 3 },
    (_, i) => new Date().getFullYear() - i
  );
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Check if there are no employees
  const hasNoEmployees = !employees || employees.length === 0;

  // Process employee data for payroll summary
  useEffect(() => {
    if (employees && employees.length > 0) {
      processPayrollData();
    } else {
      setPayrollData([]);
    }
  }, [employees, selectedMonth, selectedYear, selectedDate, filterType]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    if (type === "daily") {
      setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    }
  };

  // Calculate aggregated data based on actual work sessions
  const aggregatedData = useMemo(() => {
    console.log("Calculating aggregated data with:", {
      payrollData,
      employees,
    });
    if (!payrollData.length) return { daily: [], weekly: [], monthly: {} };

    let dateStart, dateEnd;

    if (filterType === "daily" && selectedDate) {
      const targetDate = parseISO(selectedDate);
      dateStart = startOfDay(targetDate);
      dateEnd = endOfDay(targetDate);
    } else {
      const targetDate = new Date(selectedYear, selectedMonth, 1);
      dateStart = startOfMonth(targetDate);
      dateEnd = endOfMonth(targetDate);
    }

    // Generate all days in the selected period
    const daysInPeriod =
      filterType === "daily" && selectedDate
        ? [parseISO(selectedDate)]
        : eachDayOfInterval({ start: dateStart, end: dateEnd });

    // Calculate daily aggregates based on actual work sessions
    const dailyAggregates = daysInPeriod.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      let totalPayForDay = 0;
      const employeePayments = [];

      payrollData.forEach((employee) => {
        // Find work sessions for this day
        const dayWorkSessions = employee.workSessions.filter(
          (session) => session.date === dayStr
        );
        const dayPay = dayWorkSessions.reduce(
          (sum, session) => sum + session.totalPay,
          0
        );
        const dayOvertimeMinutes = dayWorkSessions.reduce(
          (sum, session) => sum + session.overtimeMinutes,
          0
        );
        const dayOvertimeHours = dayOvertimeMinutes / 60;

        totalPayForDay += dayPay;

        employeePayments.push({
          name: employee.name,
          department: employee.department, // Add this line
          pay: dayPay,
          overtime: dayOvertimeHours > 0 ? dayOvertimeHours.toFixed(1) : 0,
          status: dayPay > 0 ? "Present" : "Absent",
          sessions: dayWorkSessions.length,
        });
      });

      return {
        date: day,
        dateStr: dayStr,
        formattedDate: format(day, "MMM dd, yyyy"),
        dayName: format(day, "EEEE"), // Monday, Tuesday, etc.
        totalPay: totalPayForDay,
        employeePayments,
        employeesPresent: employeePayments.filter(
          (emp) => emp.status === "Present"
        ).length,
        employeesAbsent: employeePayments.filter(
          (emp) => emp.status === "Absent"
        ).length,
      };
    });

    // Calculate weekly aggregates (only for monthly view)
    let weeklyAggregates = [];
    if (filterType === "monthly") {
      const weeksInMonth = eachWeekOfInterval(
        { start: dateStart, end: dateEnd },
        { weekStartsOn: 0 } // Sunday
      );

      weeklyAggregates = weeksInMonth.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
        const daysInWeek = dailyAggregates.filter(
          (day) => day.date >= weekStart && day.date <= weekEnd
        );
        const totalWeeklyPay = daysInWeek.reduce(
          (sum, day) => sum + day.totalPay,
          0
        );

        return {
          weekNumber: index + 1,
          weekStart,
          weekEnd,
          formattedWeek: `${format(weekStart, "MMM dd")} - ${format(
            weekEnd,
            "MMM dd"
          )}`,
          totalPay: totalWeeklyPay,
          daysInWeek,
          workingDays: daysInWeek.filter((day) => day.totalPay > 0).length,
        };
      });
    }

    // Calculate total pay from actual work sessions
    const totalPay = payrollData.reduce((sum, employee) => {
      return sum + employee.calculatedTotalPay;
    }, 0);

    // Count working days (days with any pay)
    const workingDays = dailyAggregates.filter(
      (day) => day.totalPay > 0
    ).length;

    // Calculate aggregate
    const periodAggregate = {
      filterType,
      month: selectedMonth,
      year: selectedYear,
      selectedDate,
      formattedPeriod:
        filterType === "daily" && selectedDate
          ? `${format(parseISO(selectedDate), "EEEE, MMMM dd, yyyy")}`
          : `${monthNames[selectedMonth]} ${selectedYear}`,
      totalPay: totalPay,
      totalWorkingDays: workingDays,
      totalEmployees: payrollData.length,
      weeklyBreakdown: weeklyAggregates,
    };

    console.log("Calculated aggregated data:", {
      daily: dailyAggregates.slice(0, 3), // Log first 3 days
      totalPay,
      employeeCount: payrollData.length,
      workingDays,
    });

    return {
      daily: dailyAggregates,
      weekly: weeklyAggregates,
      monthly: periodAggregate,
    };
  }, [payrollData, selectedMonth, selectedYear, selectedDate, filterType]);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        filterType,
        selectedDate,
        selectedMonth,
        selectedYear,
        payrollData: aggregatedData,
      });
    }
  }, [
    filterType,
    selectedDate,
    selectedMonth,
    selectedYear,
    payrollData,
    onFilterChange,
  ]);

  const processPayrollData = async () => {
    try {
      setLoadingPayroll(true);

      let dateStart, dateEnd;

      if (filterType === "daily" && selectedDate) {
        // Daily filter
        const targetDate = parseISO(selectedDate);
        dateStart = startOfDay(targetDate);
        dateEnd = endOfDay(targetDate);
      } else {
        // Monthly filter (default)
        const targetDate = new Date(selectedYear, selectedMonth, 1);
        dateStart = startOfMonth(targetDate);
        dateEnd = endOfMonth(targetDate);
      }

      const processedData = await Promise.all(
        employees.map(async (employee) => {
          try {
            // Fetch check-ins for this employee within the selected period
            const checkInsRef = collection(firestoreDb, "CheckIns");
            const checkInsQuery = query(
              checkInsRef,
              where("employeeId", "==", employee.id),
              orderBy("checkInTime", "asc")
            );
            const checkInsSnapshot = await getDocs(checkInsQuery);

            // Fetch check-outs for this employee within the selected period
            const checkOutsRef = collection(firestoreDb, "CheckOuts");
            const checkOutsQuery = query(
              checkOutsRef,
              where("employeeId", "==", employee.id),
              orderBy("checkOutTime", "asc")
            );
            const checkOutsSnapshot = await getDocs(checkOutsQuery);

            // Process check-ins and check-outs
            const checkIns = [];
            checkInsSnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.checkInTime) {
                let checkInTime;
                if (data.checkInTime.toDate) {
                  checkInTime = data.checkInTime.toDate();
                } else if (data.checkInTime.seconds) {
                  checkInTime = new Date(data.checkInTime.seconds * 1000);
                } else {
                  checkInTime = new Date(data.checkInTime);
                }

                // Filter by selected period
                if (checkInTime >= dateStart && checkInTime <= dateEnd) {
                  checkIns.push({
                    id: doc.id,
                    time: checkInTime,
                    sessionId: data.sessionId,
                    isLate: data.isLate || false,
                  });
                }
              }
            });

            const checkOuts = [];
            checkOutsSnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.checkOutTime) {
                let checkOutTime;
                if (data.checkOutTime.toDate) {
                  checkOutTime = data.checkOutTime.toDate();
                } else if (data.checkOutTime.seconds) {
                  checkOutTime = new Date(data.checkOutTime.seconds * 1000);
                } else {
                  checkOutTime = new Date(data.checkOutTime);
                }

                // Filter by selected period
                if (checkOutTime >= dateStart && checkOutTime <= dateEnd) {
                  checkOuts.push({
                    id: doc.id,
                    time: checkOutTime,
                    sessionId: data.sessionId,
                    isEarly: data.isEarly || false,
                  });
                }
              }
            });

            // Create work sessions by matching check-ins with check-outs
            const workSessions = [];
            checkIns.forEach((checkIn) => {
              const matchingCheckOut = checkOuts.find(
                (checkOut) => checkOut.sessionId === checkIn.sessionId
              );
              if (matchingCheckOut) {
                const workingMinutes = differenceInMinutes(
                  matchingCheckOut.time,
                  checkIn.time
                );
                const hourlyRate =
                  Number.parseFloat(employee.comp.replace("D", "")) || 15;
                const standardWorkdayMinutes = 8 * 60;
                const regularMinutes = Math.min(
                  workingMinutes,
                  standardWorkdayMinutes
                );
                const overtimeMinutes = Math.max(
                  0,
                  workingMinutes - standardWorkdayMinutes
                );

                const regularPay = (regularMinutes / 60) * hourlyRate;
                const overtimePay = (overtimeMinutes / 60) * (hourlyRate * 1.5);
                const totalSessionPay = regularPay + overtimePay;

                workSessions.push({
                  date: format(checkIn.time, "yyyy-MM-dd"),
                  checkIn: checkIn.time,
                  checkOut: matchingCheckOut.time,
                  workingMinutes,
                  regularMinutes,
                  overtimeMinutes,
                  regularPay,
                  overtimePay,
                  totalPay: totalSessionPay,
                  isLate: checkIn.isLate,
                  isEarly: matchingCheckOut.isEarly,
                });
              }
            });

            const hourlyRate =
              Number.parseFloat(employee.comp.replace("D", "")) || 15;
            const totalSessionPay = workSessions.reduce(
              (sum, session) => sum + session.totalPay,
              0
            );

            return {
              ...employee,
              workSessions,
              hourlyRate,
              calculatedTotalPay: totalSessionPay,
            };
          } catch (error) {
            console.error(`Error processing employee ${employee.id}:`, error);
            return {
              ...employee,
              workSessions: [],
              hourlyRate:
                Number.parseFloat(employee.comp.replace("D", "")) || 15,
              calculatedTotalPay: 0,
            };
          }
        })
      );

      console.log(
        "Processed payroll data with actual Firebase data:",
        processedData
      );
      setPayrollData(processedData);
    } catch (error) {
      console.error("Error processing payroll data:", error);
    } finally {
      setLoadingPayroll(false);
    }
  };

  // Check if there's any payroll data for the selected period
  const hasPayrollData =
    payrollData.length > 0 && aggregatedData.monthly.totalPay > 0;

  if (loading || loadingPayroll) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading payroll data...</Typography>
        </Box>
      </Paper>
    );
  }

  // Show no employees message
  if (hasNoEmployees) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Payroll Summary Dashboard
        </Typography>
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            No Employees Exist
          </Typography>
          <Typography>
            There are currently no employees in the system. Please add employees
            to view payroll data.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Payroll Summary Dashboard
        </Typography>

        {/* Filter Type Selection */}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Button
            variant={filterType === "monthly" ? "contained" : "outlined"}
            onClick={() => handleFilterTypeChange("monthly")}
            size="small"
          >
            Month View
          </Button>
          <Button
            variant={filterType === "daily" ? "contained" : "outlined"}
            onClick={() => handleFilterTypeChange("daily")}
            size="small"
          >
            Select Specific Date
          </Button>
        </Box>

        {/* Filter Controls */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
          {filterType === "monthly" ? (
            <>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                >
                  {monthNames.map((month, index) => (
                    <MenuItem key={index} value={index}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Year"
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <TextField
              type="date"
              label="Select Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}
        </Box>

        {/* Show No Data message if no payroll data exists */}
        {!hasPayrollData ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              No Data Available
            </Typography>
            <Typography>
              No payroll data found for {aggregatedData.monthly.formattedPeriod}
              .
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: "#e3f2fd" }}>
                  <CardContent>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      D{aggregatedData.monthly.totalPay?.toFixed(2) || "0.00"}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {filterType === "daily" ? "Daily" : "Monthly"} Total (
                      {aggregatedData.monthly.formattedPeriod})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {aggregatedData.monthly.totalWorkingDays} working{" "}
                      {aggregatedData.monthly.totalWorkingDays === 1
                        ? "day"
                        : "days"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: "#e8f5e8" }}>
                  <CardContent>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      sx={{ color: "#2e7d32" }}
                    >
                      {aggregatedData.monthly.totalEmployees}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Total Employees
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active in {aggregatedData.monthly.formattedPeriod}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs - Hide weekly/monthly tabs for daily view */}
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab
                label={filterType === "daily" ? "Daily Details" : "Daily View"}
              />
              {filterType === "monthly" && <Tab label="Weekly View" />}
              {filterType === "monthly" && <Tab label="Monthly Summary" />}
            </Tabs>
          </>
        )}
      </Box>

      {/* Only show content if there's payroll data */}
      {hasPayrollData && (
        <>
          {/* Daily View */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {filterType === "daily"
                  ? "Daily Payroll Details"
                  : "Daily Payroll Breakdown"}{" "}
                - {aggregatedData.monthly.formattedPeriod}
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f9f9f9" }}>
                    <TableRow>
                      <TableCell>
                        <strong>Date</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Day</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Present</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Absent</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Daily Total</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Employee Breakdown</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {aggregatedData.daily
                      .filter(
                        (day) => filterType === "daily" || day.totalPay > 0
                      ) // Show all days for daily view, only working days for monthly
                      .map((day) => (
                        <TableRow key={day.dateStr} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {day.formattedDate}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {day.dayName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={day.employeesPresent}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={day.employeesAbsent}
                              color="error"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="primary"
                            >
                              D{day.totalPay.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ maxWidth: 400 }}>
                              {day.employeePayments
                                .filter((emp) => emp.status === "Present") // Only show present employees
                                .map((emp, idx) => (
                                  <Box
                                    key={idx}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      py: 0.5,
                                    }}
                                  >
                                    <Typography variant="body2">
                                      {emp.name}:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="success.main"
                                    >
                                      D{emp.pay.toFixed(2)}
                                      {emp.overtime > 0 &&
                                        ` (+${emp.overtime}h OT)`}
                                    </Typography>
                                  </Box>
                                ))}
                              {day.employeesPresent === 0 && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  No employees present
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {aggregatedData.daily.filter(
                (day) => filterType === "daily" || day.totalPay > 0
              ).length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography>
                    No payroll data available for this period.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Weekly View - Only for monthly filter */}
          {activeTab === 1 && filterType === "monthly" && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Weekly Payroll Summary -{" "}
                {aggregatedData.monthly.formattedPeriod}
              </Typography>
              <Grid container spacing={3}>
                {aggregatedData.weekly
                  .filter((week) => week.totalPay > 0) // Only show weeks with data
                  .map((week) => (
                    <Grid item xs={12} md={6} key={week.weekNumber}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Week {week.weekNumber}: {week.formattedWeek}
                          </Typography>
                          <Typography variant="h4" color="primary" gutterBottom>
                            D{week.totalPay.toFixed(2)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            {week.workingDays} working days this week
                          </Typography>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" gutterBottom>
                            Daily Breakdown:
                          </Typography>
                          {week.daysInWeek
                            .filter((day) => day.totalPay > 0) // Only show days with data
                            .map((day, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  py: 1,
                                }}
                              >
                                <Typography variant="body2">
                                  {format(day.date, "EEE, MMM dd")}:
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  D{day.totalPay.toFixed(2)}
                                </Typography>
                              </Box>
                            ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
              {aggregatedData.weekly.filter((week) => week.totalPay > 0)
                .length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography>
                    No weekly payroll data available for this month.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Monthly Summary - Only for monthly filter */}
          {((activeTab === 2 && filterType === "monthly") ||
            (activeTab === 1 && filterType === "daily")) && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {filterType === "daily" ? "Daily" : "Monthly"} Summary -{" "}
                {aggregatedData.monthly.formattedPeriod}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="primary" gutterBottom>
                        D{aggregatedData.monthly.totalPay.toFixed(2)}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        Total {filterType === "daily" ? "Daily" : "Monthly"}{" "}
                        Payroll
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Working Days:
                          </Typography>
                          <Typography variant="h6">
                            {aggregatedData.monthly.totalWorkingDays}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Employees:
                          </Typography>
                          <Typography variant="h6">
                            {aggregatedData.monthly.totalEmployees}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                {filterType === "monthly" && (
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Weekly Breakdown
                        </Typography>
                        {aggregatedData.weekly
                          .filter((week) => week.totalPay > 0) // Only show weeks with data
                          .map((week) => (
                            <Box
                              key={week.weekNumber}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                py: 1,
                              }}
                            >
                              <Typography variant="body2">
                                Week {week.weekNumber}:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                D{week.totalPay.toFixed(2)}
                              </Typography>
                            </Box>
                          ))}
                        {aggregatedData.weekly.filter(
                          (week) => week.totalPay > 0
                        ).length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No weekly data available
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default PayrollSummary;
