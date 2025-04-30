import React from "react";

const AttendanceReportCard = ({style , title , value , icon}) => {
  return (
    <div className={`h-[120px] flex flex-col justify-between p-3 ${style} rounded-xl`}>
      <div className="flex justify-between px-3">
        <p className="text-xl font-medium text-[#00000080]">{title}</p>
        <img src={icon} alt="" />
      </div>
      <p className="text-3xl font-semibold text-[#000000] px-3">{value}</p>
    </div>
  );
};

export default AttendanceReportCard;
