"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { useState, useEffect } from "react"

const AttendanceDasboardChart = ({ data, onPeriodChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("12months")

  useEffect(() => {
    // Notify parent component when period changes
    if (onPeriodChange) {
      onPeriodChange(selectedPeriod)
    }
  }, [selectedPeriod, onPeriodChange])

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Attendance Chart</h3>
        <div className="flex space-x-2 cursor-pointer">
          <button
            onClick={() => handlePeriodChange("12months")}
            className={`px-3 py-1 text-xs rounded-full cursor-pointer ${
              selectedPeriod === "12months" ? "bg-blue-100 text-blue-600" : "text-gray-500"
            }`}
          >
            12 months
          </button>
          <button
            onClick={() => handlePeriodChange("30days")}
            className={`px-3 py-1 text-xs rounded-full cursor-pointer ${
              selectedPeriod === "30days" ? "bg-blue-100 text-blue-600" : "text-gray-500"
            }`}
          >
            30 days
          </button>
          <button
            onClick={() => handlePeriodChange("7days")}
            className={`px-3 py-1 text-xs rounded-full cursor-pointer ${
              selectedPeriod === "7days" ? "bg-blue-100 text-blue-600" : "text-gray-500"
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => handlePeriodChange("24hours")}
            className={`px-3 py-1 text-xs rounded-full cursor-pointer ${
              selectedPeriod === "24hours" ? "bg-blue-100 text-blue-600" : "text-gray-500"
            }`}
          >
            24 Hours
          </button>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
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
                backgroundColor: "#fff",
                border: "none",
                borderRadius: "4px",
                color: "white",
                fontSize: "12px",
              }}

              formatter={(value) => [`${value}%`, "Attendance"]}
            />
            <Line
              type="monotone"
              dataKey="attendance"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: "#10B981", stroke: "white", strokeWidth: 2 }}
            />
            {data && data.length > 0 && data[data.length - 1] && (
              <ReferenceLine
                x={data[data.length - 1].name}
                stroke="#10B981"
                strokeDasharray="3 3"
                label={{
                  value: `${data[data.length - 1].attendance}%`,
                  position: "top",
                  fill: "#10B981",
                  fontSize: 12,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AttendanceDasboardChart
