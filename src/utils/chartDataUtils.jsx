/**
 * Generates attendance data for the line chart based on check-ins
 * @param {Array} checkIns - Array of check-in records
 * @param {Array} staffList - Array of staff members
 * @param {String} period - Time period to display (12months, 30days, 7days, 24hours)
 * @returns {Array} - Formatted data for the attendance chart
 */
export const generateAttendanceChartData = (
  checkIns,
  staffList,
  period = "12months"
) => {
  if (
    !checkIns ||
    !staffList ||
    checkIns.length === 0 ||
    staffList.length === 0
  ) {
    return [];
  }

  const currentDate = new Date();
  const data = [];

  switch (period) {
    case "12months":
      return generateMonthlyData(checkIns, staffList, 12);
    case "30days":
      return generateDailyData(checkIns, staffList, 30);
    case "7days":
      return generateDailyData(checkIns, staffList, 7);
    case "24hours":
      return generateHourlyData(checkIns, staffList, 24);
    default:
      return generateMonthlyData(checkIns, staffList, 12);
  }
};

/**
 * Generates monthly attendance data
 */
const generateMonthlyData = (checkIns, staffList, months = 12) => {
  const currentDate = new Date();
  const data = [];

  // Generate data for the last X months
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);

    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const month = date.getMonth();

    // Start and end of month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    // Count check-ins for this month
    const monthlyCheckIns = checkIns.filter((checkIn) => {
      if (!checkIn.checkInTime) return false;

      const checkInDate = checkIn.checkInTime.toDate
        ? checkIn.checkInTime.toDate()
        : new Date(checkIn.checkInTime);

      return checkInDate >= startOfMonth && checkInDate <= endOfMonth;
    });

    // Calculate working days in month (excluding weekends)
    let workingDays = 0;
    const tempDate = new Date(startOfMonth);
    while (tempDate <= endOfMonth) {
      const dayOfWeek = tempDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not weekend
        workingDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Calculate attendance percentage
    // Each staff member should check in each working day
    const totalPossibleCheckIns = staffList.length * workingDays;
    const attendancePercentage =
      totalPossibleCheckIns > 0
        ? Math.round((monthlyCheckIns.length / totalPossibleCheckIns) * 100)
        : 0;

    data.push({
      name: monthName,
      attendance: attendancePercentage,
    });
  }

  return data;
};

/**
 * Generates daily attendance data
 */
const generateDailyData = (checkIns, staffList, days = 30) => {
  const currentDate = new Date();
  const data = [];
  const totalStaff = staffList.length;

  // Generate data for the last X days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);

    // Format the date as "DD MMM" (e.g., "15 Jan")
    const dayName = `${date.getDate()} ${date.toLocaleString("default", {
      month: "short",
    })}`;

    // Start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Count check-ins for this day
    const dailyCheckIns = checkIns.filter((checkIn) => {
      if (!checkIn.checkInTime) return false;

      const checkInDate = checkIn.checkInTime.toDate
        ? checkIn.checkInTime.toDate()
        : new Date(checkIn.checkInTime);

      return checkInDate >= startOfDay && checkInDate <= endOfDay;
    });

    // Calculate attendance percentage
    const attendancePercentage =
      totalStaff > 0
        ? Math.round((dailyCheckIns.length / totalStaff) * 100)
        : 0;

    data.push({
      name: dayName,
      attendance: attendancePercentage,
    });
  }

  return data;
};

/**
 * Generates hourly attendance data
 */
const generateHourlyData = (checkIns, staffList, hours = 24) => {
  const currentDate = new Date();
  const data = [];
  const totalStaff = staffList.length;

  // Generate data for the last X hours
  for (let i = hours - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setHours(date.getHours() - i);

    // Format the hour as "HH:00" (e.g., "14:00")
    const hourName = `${date.getHours()}:00`;

    // Start and end of hour
    const startOfHour = new Date(date);
    startOfHour.setMinutes(0, 0, 0);

    const endOfHour = new Date(date);
    endOfHour.setMinutes(59, 59, 999);

    // Count check-ins for this hour
    const hourlyCheckIns = checkIns.filter((checkIn) => {
      if (!checkIn.checkInTime) return false;

      const checkInDate = checkIn.checkInTime.toDate
        ? checkIn.checkInTime.toDate()
        : new Date(checkIn.checkInTime);

      return checkInDate >= startOfHour && checkInDate <= endOfHour;
    });

    // Calculate attendance percentage
    // For hourly data, we're looking at what percentage of staff checked in during this hour
    const attendancePercentage =
      totalStaff > 0
        ? Math.round((hourlyCheckIns.length / totalStaff) * 100)
        : 0;

    data.push({
      name: hourName,
      attendance: attendancePercentage,
    });
  }

  return data;
};

/**
 * Generates weekly attendance data for the bar chart
 * @param {Array} checkIns - Array of check-in records
 * @param {Array} staffList - Array of staff members
 * @param {Number} daysToInclude - Number of days to look back (default: 7)
 * @returns {Array} - Formatted data for the weekly attendance chart
 */
export const generateWeeklyAttendanceData = (
  checkIns,
  staffList,
  daysToInclude = 7
) => {
  if (
    !checkIns ||
    !staffList ||
    checkIns.length === 0 ||
    staffList.length === 0
  ) {
    return [];
  }

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const data = [];

  const currentDate = new Date();
  const totalStaff = staffList.length;

  // Generate data for each day of the week
  for (let i = 0; i < daysToInclude; i++) {
    // Calculate the date for this day
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);

    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayName = days[dayIndex];

    // Start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Count check-ins for this day
    const dailyCheckIns = checkIns.filter((checkIn) => {
      if (!checkIn.checkInTime) return false;

      const checkInDate = checkIn.checkInTime.toDate
        ? checkIn.checkInTime.toDate()
        : new Date(checkIn.checkInTime);

      return checkInDate >= startOfDay && checkInDate <= endOfDay;
    });

    // Calculate attendance percentage
    const attendancePercentage = Math.round(
      (dailyCheckIns.length / totalStaff) * 100
    );

    data.unshift({
      // Add to beginning of array to maintain chronological order
      day: dayName,
      attendance: attendancePercentage,
    });
  }

  return data;
};
