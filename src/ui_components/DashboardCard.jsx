import React, { useState } from "react";

const DashboardCard = ({ title, value, icon, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle = {
    backgroundColor: "#FEFEFE",
    border: "1px solid #E9EAEA",
    borderRadius: "1rem", // rounded-2xl
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "140px",
    padding: "0.75rem", // p-3
    marginRight: "1rem", // mr-4
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: isHovered ? "0 4px 6px rgba(0,0,0,0.1)" : "none",
    background: isHovered ? "#F0F0F0" : "#FEFEFE",
  };

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-center">
        <h4 className="text-lg">{title}</h4>
        <img src={icon} alt={`${title} icon`} />
      </div>
      <h1 className="text-3xl mt-auto">{value}</h1>
    </div>
  );
};

export default DashboardCard;
