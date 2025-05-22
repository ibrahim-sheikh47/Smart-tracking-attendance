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
} from "@mui/material";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { firestoreDb } from "../config/firebase.jsx";
import { differenceInMinutes, format, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval } from "date-fns";

const PayrollSummary = ({ employees, loading }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // Generate year options for the last 3 years
  const yearOptions = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
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
  }, [employees, selectedMonth, selectedYear]);

  const processPayrollData = async () => {
    try {
      setLoadingPayroll(true);

      // Get actual check-in and check-out data from Firebase for the selected month/year
      const selectedDate = new Date(selectedYear, selectedMonth, 1);
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      const processedData = await Promise.all(employees.map(async (employee) => {
        try {
          // Fetch check-ins for this employee within the selected month
          const checkInsRef = collection(firestoreDb, "CheckIns");
          const checkInsQuery = query(
            checkInsRef,
            where("employeeId", "==", employee.id),
            orderBy("checkInTime", "asc")
          );
          const checkInsSnapshot = await getDocs(checkInsQuery);

          // Fetch check-outs for this employee within the selected month
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

              // Only include check-ins within the selected month
              if (checkInTime >= monthStart && checkInTime <= monthEnd) {
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

              // Only include check-outs within the selected month
              if (checkOutTime >= monthStart && checkOutTime <= monthEnd) {
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
              const workingMinutes = differenceInMinutes(matchingCheckOut.time, checkIn.time);
              const hourlyRate = parseFloat(employee.comp.replace('D', '')) || 15;
              const standardWorkdayMinutes = 8 * 60;

              const regularMinutes = Math.min(workingMinutes, standardWorkdayMinutes);
              const overtimeMinutes = Math.max(0, workingMinutes - standardWorkdayMinutes);

              const regularPay = (regularMinutes / 60) * hourlyRate;
              const overtimePay = (overtimeMinutes / 60) * (hourlyRate * 1.5);
              const totalSessionPay = regularPay + overtimePay;

              workSessions.push({
                date: format(checkIn.time, 'yyyy-MM-dd'),
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

          const hourlyRate = parseFloat(employee.comp.replace('D', '')) || 15;
          const totalSessionPay = workSessions.reduce((sum, session) => sum + session.totalPay, 0);

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
            hourlyRate: parseFloat(employee.comp.replace('D', '')) || 15,
            calculatedTotalPay: 0,
          };
        }
      }));

      console.log("Processed payroll data with actual Firebase data:", processedData);
      setPayrollData(processedData);
    } catch (error) {
      console.error("Error processing payroll data:", error);
    } finally {
      setLoadingPayroll(false);
    }
  };

  // Calculate aggregated data based on actual work sessions
  const aggregatedData = useMemo(() => {
    console.log("Calculating aggregated data with:", { payrollData, employees });

    if (!payrollData.length) return { daily: [], weekly: [], monthly: {} };

    const selectedDate = new Date(selectedYear, selectedMonth, 1);
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    // Generate all days in the selected month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate daily aggregates based on actual work sessions
    const dailyAggregates = daysInMonth.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      let totalPayForDay = 0;
      const employeePayments = [];

      payrollData.forEach(employee => {
        // Find work sessions for this day
        const dayWorkSessions = employee.workSessions.filter(session =>
          session.date === dayStr
        );

        const dayPay = dayWorkSessions.reduce((sum, session) => sum + session.totalPay, 0);
        const dayOvertimeMinutes = dayWorkSessions.reduce((sum, session) => sum + session.overtimeMinutes, 0);
        const dayOvertimeHours = dayOvertimeMinutes / 60;

        totalPayForDay += dayPay;

        employeePayments.push({
          name: employee.name,
          pay: dayPay,
          overtime: dayOvertimeHours > 0 ? dayOvertimeHours.toFixed(1) : 0,
          status: dayPay > 0 ? 'Present' : 'Absent',
          sessions: dayWorkSessions.length
        });
      });

      return {
        date: day,
        dateStr: dayStr,
        formattedDate: format(day, 'MMM dd, yyyy'),
        totalPay: totalPayForDay,
        employeePayments,
        employeesPresent: employeePayments.filter(emp => emp.status === 'Present').length,
        employeesAbsent: employeePayments.filter(emp => emp.status === 'Absent').length,
      };
    });

    // Calculate weekly aggregates
    const weeksInMonth = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 0 } // Sunday
    );

    const weeklyAggregates = weeksInMonth.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const daysInWeek = dailyAggregates.filter(day =>
        day.date >= weekStart && day.date <= weekEnd
      );

      const totalWeeklyPay = daysInWeek.reduce((sum, day) => sum + day.totalPay, 0);

      return {
        weekNumber: index + 1,
        weekStart,
        weekEnd,
        formattedWeek: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
        totalPay: totalWeeklyPay,
        daysInWeek,
        workingDays: daysInWeek.filter(day => day.totalPay > 0).length,
      };
    });

    // Calculate total monthly pay from actual work sessions
    const totalMonthlyPay = payrollData.reduce((sum, employee) => {
      return sum + employee.calculatedTotalPay;
    }, 0);

    // Count working days (days with any pay)
    const workingDays = dailyAggregates.filter(day => day.totalPay > 0).length;

    // Calculate monthly aggregate
    const monthlyAggregate = {
      month: selectedMonth,
      year: selectedYear,
      formattedMonth: `${monthNames[selectedMonth]} ${selectedYear}`,
      totalPay: totalMonthlyPay,
      totalWorkingDays: workingDays,
      totalEmployees: payrollData.length,
      weeklyBreakdown: weeklyAggregates,
    };

    console.log("Calculated aggregated data:", {
      daily: dailyAggregates.slice(0, 3), // Log first 3 days
      totalMonthlyPay,
      employeeCount: payrollData.length,
      workingDays
    });

    return {
      daily: dailyAggregates,
      weekly: weeklyAggregates,
      monthly: monthlyAggregate,
    };
  }, [payrollData, selectedMonth, selectedYear]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Check if there's any payroll data for the selected period
  const hasPayrollData = payrollData.length > 0 && aggregatedData.monthly.totalPay > 0;

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
            There are currently no employees in the system. Please add employees to view payroll data.
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

        {/* Month and Year Selectors */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthNames.map((month, index) => (
                <MenuItem key={index} value={index}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {yearOptions.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Show No Data message if no payroll data exists */}
        {!hasPayrollData ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              No Data Available
            </Typography>
            <Typography>
              No payroll data found for {monthNames[selectedMonth]} {selectedYear}.
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      D{aggregatedData.monthly.totalPay?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Monthly Total ({aggregatedData.monthly.formattedMonth})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {aggregatedData.monthly.totalWorkingDays} working days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#e8f5e8' }}>
                  <CardContent>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                      {aggregatedData.monthly.totalEmployees}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Total Employees
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active in {aggregatedData.monthly.formattedMonth}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Daily View" />
              <Tab label="Weekly View" />
              <Tab label="Monthly Summary" />
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
                Daily Payroll Breakdown - {aggregatedData.monthly.formattedMonth}
              </Typography>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f9f9f9" }}>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Present</strong></TableCell>
                      <TableCell><strong>Absent</strong></TableCell>
                      <TableCell><strong>Daily Total</strong></TableCell>
                      <TableCell><strong>Employee Breakdown</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {aggregatedData.daily
                      .filter(day => day.totalPay > 0) // Only show days with data
                      .map((day) => (
                        <TableRow key={day.dateStr} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {day.formattedDate}
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
                            <Typography variant="body1" fontWeight="bold" color="primary">
                              D{day.totalPay.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ maxWidth: 400 }}>
                              {day.employeePayments
                                .filter(emp => emp.status === 'Present') // Only show present employees
                                .map((emp, idx) => (
                                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2">
                                      {emp.name}:
                                    </Typography>
                                    <Typography variant="body2" color="success.main">
                                      D{emp.pay.toFixed(2)}
                                      {emp.overtime > 0 && ` (+${emp.overtime}h OT)`}
                                    </Typography>
                                  </Box>
                                ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {aggregatedData.daily.filter(day => day.totalPay > 0).length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography>No daily payroll data available for this month.</Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Weekly View */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Weekly Payroll Summary - {aggregatedData.monthly.formattedMonth}
              </Typography>

              <Grid container spacing={3}>
                {aggregatedData.weekly
                  .filter(week => week.totalPay > 0) // Only show weeks with data
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
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {week.workingDays} working days this week
                          </Typography>

                          <Divider sx={{ my: 2 }} />

                          <Typography variant="subtitle2" gutterBottom>
                            Daily Breakdown:
                          </Typography>
                          {week.daysInWeek
                            .filter(day => day.totalPay > 0) // Only show days with data
                            .map((day, idx) => (
                              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2">
                                  {format(day.date, 'EEE, MMM dd')}:
                                </Typography>
                                <Typography variant="body2" fontWeight="medium" color="success.main">
                                  D{day.totalPay.toFixed(2)}
                                </Typography>
                              </Box>
                            ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>

              {aggregatedData.weekly.filter(week => week.totalPay > 0).length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography>No weekly payroll data available for this month.</Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Monthly Summary */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Monthly Summary - {aggregatedData.monthly.formattedMonth}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="primary" gutterBottom>
                        D{aggregatedData.monthly.totalPay.toFixed(2)}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        Total Monthly Payroll
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

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Weekly Breakdown
                      </Typography>
                      {aggregatedData.weekly
                        .filter(week => week.totalPay > 0) // Only show weeks with data
                        .map((week) => (
                          <Box key={week.weekNumber} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                            <Typography variant="body2">
                              Week {week.weekNumber}:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              D{week.totalPay.toFixed(2)}
                            </Typography>
                          </Box>
                        ))}

                      {aggregatedData.weekly.filter(week => week.totalPay > 0).length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No weekly data available
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default PayrollSummary;