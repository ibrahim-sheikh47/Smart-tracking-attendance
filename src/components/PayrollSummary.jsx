"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  getMonth,
  getYear,
} from "date-fns";

const PayrollSummary = ({ employees, loading }) => {
  const [period, setPeriod] = useState("monthly");
  const [summaryData, setSummaryData] = useState({
    totalPaid: 0,
    regularPay: 0,
    overtimePay: 0,
    averagePay: 0,
    highestPaid: { name: "", amount: 0 },
    chartData: [],
  });

  useEffect(() => {
    if (!loading && employees && employees.length > 0) {
      calculateSummaryData(period);
    }
  }, [employees, loading, period]);

  const calculateSummaryData = (selectedPeriod) => {
    // Log the employee data to debug
    console.log("Employee data for payroll calculation:", employees);

    const now = new Date();
    let periods = [];
    let periodStart, periodEnd;

    // Define time periods based on selection
    switch (selectedPeriod) {
      case "daily":
        // Last 7 days
        periods = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(now, 6 - i);
          return {
            name: format(date, "dd MMM"),
            start: startOfDay(date),
            end: endOfDay(date),
            date: date,
          };
        });
        periodStart = periods[0].start;
        periodEnd = periods[periods.length - 1].end;
        break;

      case "weekly":
        // Last 4 weeks
        periods = Array.from({ length: 4 }, (_, i) => {
          const weekStart = startOfWeek(subWeeks(now, 3 - i), {
            weekStartsOn: 1,
          });
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          return {
            name: `Week ${i + 1}`,
            start: weekStart,
            end: weekEnd,
            date: weekStart,
          };
        });
        periodStart = periods[0].start;
        periodEnd = periods[periods.length - 1].end;
        break;

      case "monthly":
      default:
        // Last 6 months
        periods = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(now, 5 - i);
          return {
            name: format(date, "MMM"),
            start: startOfMonth(date),
            end: endOfMonth(date),
            date: date,
            month: getMonth(date),
            year: getYear(date),
          };
        });
        periodStart = periods[0].start;
        periodEnd = periods[periods.length - 1].end;
        break;
    }

    // Process all employees to get total values
    let totalPaid = 0;
    let regularPay = 0;
    let overtimePay = 0;
    let highestPaid = { name: "", amount: 0 };

    // For chart data, initialize period totals with zero
    const periodTotals = periods.map((period) => ({
      ...period,
      amount: 0,
    }));

    // Get current month and year
    const currentMonth = getMonth(now);
    const currentYear = getYear(now);

    // Process each employee
    employees.forEach((employee) => {
      try {
        // Parse the totalPay value
        let employeeTotalPay = 0;
        if (
          typeof employee.totalPay === "string" &&
          employee.totalPay.startsWith("D")
        ) {
          employeeTotalPay = Number.parseFloat(employee.totalPay.substring(1));
        }

        console.log(
          `Employee ${employee.name}, totalPay: ${employee.totalPay}, parsed: ${employeeTotalPay}`
        );

        if (!isNaN(employeeTotalPay)) {
          totalPaid += employeeTotalPay;

          // Parse hourly rate
          let hourlyRate = 0;
          if (
            typeof employee.comp === "string" &&
            employee.comp.startsWith("D")
          ) {
            hourlyRate = Number.parseFloat(employee.comp.substring(1));
          }

          // Parse overtime hours
          let overtimeHours = 0;
          if (employee.overtime && employee.overtime !== "None") {
            const overtimeMatch = employee.overtime.match(/(\d+)\s*hour/);
            if (overtimeMatch && overtimeMatch[1]) {
              overtimeHours = Number.parseInt(overtimeMatch[1], 10);
            }
          }

          // Calculate estimated overtime pay (hourly rate * 1.5 * overtime hours)
          const estimatedOvertimePay = overtimeHours * hourlyRate * 1.5;
          overtimePay += estimatedOvertimePay;
          regularPay += employeeTotalPay - estimatedOvertimePay;

          // Track highest paid employee
          if (employeeTotalPay > highestPaid.amount) {
            highestPaid = { name: employee.name, amount: employeeTotalPay };
          }

          // Instead of distributing evenly, assign pay to the current month only
          if (selectedPeriod === "monthly") {
            // Find the period that matches the current month and year
            const currentMonthPeriod = periodTotals.find(
              (period) =>
                period.month === currentMonth && period.year === currentYear
            );

            if (currentMonthPeriod) {
              currentMonthPeriod.amount += employeeTotalPay;
            }
          } else if (selectedPeriod === "weekly") {
            // For weekly view, add to the most recent week
            periodTotals[periodTotals.length - 1].amount += employeeTotalPay;
          } else if (selectedPeriod === "daily") {
            // For daily view, add to today
            const today = format(now, "dd MMM");
            const todayPeriod = periodTotals.find(
              (period) => period.name === today
            );
            if (todayPeriod) {
              todayPeriod.amount += employeeTotalPay;
            }
          }
        }
      } catch (error) {
        console.error(
          `Error calculating pay for employee ${employee.name}:`,
          error
        );
      }
    });

    // Round amounts in chart data
    const chartData = periodTotals.map((period) => ({
      name: period.name,
      amount: Math.round(period.amount * 100) / 100,
    }));

    // Calculate average pay per employee
    const averagePay = employees.length > 0 ? totalPaid / employees.length : 0;

    console.log("Calculated payroll summary:", {
      totalPaid,
      regularPay,
      overtimePay,
      averagePay,
      highestPaid,
      chartData,
    });

    setSummaryData({
      totalPaid,
      regularPay,
      overtimePay,
      averagePay,
      highestPaid,
      chartData,
    });
  };

  const handlePeriodChange = (event, newPeriod) => {
    setPeriod(newPeriod);
  };

  const formatCurrency = (amount) => {
    return `D${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Payroll Summary
      </Typography>

      <Tabs
        value={period}
        onChange={handlePeriodChange}
        sx={{ mb: 3 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab value="daily" label="Daily" />
        <Tab value="weekly" label="Weekly" />
        <Tab value="monthly" label="Monthly" />
      </Tabs>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "#f8f9fa",
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            }}
          >
            <CardContent>
              <Typography
                color="textSecondary"
                variant="subtitle2"
                gutterBottom
              >
                Total Payroll
              </Typography>
              <Typography
                variant="h5"
                component="div"
                fontWeight="bold"
                color="#3DC296"
              >
                {formatCurrency(summaryData.totalPaid)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "#f8f9fa",
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            }}
          >
            <CardContent>
              <Typography
                color="textSecondary"
                variant="subtitle2"
                gutterBottom
              >
                Regular Pay
              </Typography>
              <Typography
                variant="h5"
                component="div"
                fontWeight="bold"
                color="#2196f3"
              >
                {formatCurrency(summaryData.regularPay)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "#f8f9fa",
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            }}
          >
            <CardContent>
              <Typography
                color="textSecondary"
                variant="subtitle2"
                gutterBottom
              >
                Overtime Pay
              </Typography>
              <Typography
                variant="h5"
                component="div"
                fontWeight="bold"
                color="#ff9800"
              >
                {formatCurrency(summaryData.overtimePay)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "#f8f9fa",
              boxShadow: "none",
              border: "1px solid #e0e0e0",
            }}
          >
            <CardContent>
              <Typography
                color="textSecondary"
                variant="subtitle2"
                gutterBottom
              >
                Average Per Employee
              </Typography>
              <Typography
                variant="h5"
                component="div"
                fontWeight="bold"
                color="#673ab7"
              >
                {formatCurrency(summaryData.averagePay)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ height: 300, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Payroll Distribution
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={summaryData.chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) => `D${value}`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`D${value.toFixed(2)}`, "Amount"]}
              contentStyle={{
                backgroundColor: "#333",
                border: "none",
                borderRadius: "4px",
                color: "white",
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {summaryData.chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.amount > 0 ? "#3DC296" : "#e0e0e0"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Additional Insights
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Highest Paid Employee:</strong>{" "}
              {summaryData.highestPaid.name} (
              {formatCurrency(summaryData.highestPaid.amount)})
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Total Employees:</strong> {employees.length}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default PayrollSummary;
