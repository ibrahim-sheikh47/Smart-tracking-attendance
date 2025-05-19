import React from "react";

const DashboardCard = ({ title, value, icon , onClick }) => {
  return (
    <div
      className="bg-[#FEFEFE] border border-[#E9EAEA] rounded-2xl
                            flex flex-col w-full h-[140px] p-3 mr-4 hover:bg-[#F0F0F0] hover:shadow-md cursor-pointer transition-all duration-300"
                            onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <h4 className="text-lg">{title}</h4>
        <img src={icon} />
      </div>
      <h1 className="text-3xl mt-auto">{value}</h1>
    </div>
  );
};
export default DashboardCard;
