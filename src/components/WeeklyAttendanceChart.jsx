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

const WeeklyAttendanceChart = ({ data }) => {
  // Default data if none is provided
  const defaultData = [
    { day: "Mon", attendance: 45 },
    { day: "Tue", attendance: 55 },
    { day: "Wed", attendance: 65 },
    { day: "Thu", attendance: 85 }, // Highlighted day
    { day: "Fri", attendance: 60 },
    { day: "Sat", attendance: 50 },
    { day: "Sun", attendance: 40 },
  ];

  const chartData = data || defaultData;

  // Get current day of week to highlight
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDay = days[new Date().getDay()];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Weekly Attendance</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#333",
                border: "none",
                borderRadius: "4px",
                color: "white",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value}%`, "Attendance"]}
            />
            <Bar dataKey="attendance" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.day === currentDay ? "#3DC296" : "#E5E7EB"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyAttendanceChart;
