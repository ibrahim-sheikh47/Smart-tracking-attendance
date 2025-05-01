import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Paper, Divider } from "@mui/material";

const AttendanceChart = ({ data }) => {
  return (
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
  );
};

export default AttendanceChart;