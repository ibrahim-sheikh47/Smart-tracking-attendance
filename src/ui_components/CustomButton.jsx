import React from "react";

const CustomButton = ({ title, icon, style, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-[#3DC296] text-sm font-medium flex items-center justify-center
       gap-2 rounded-lg cursor-pointer h-8 ${style}`}
    >
      <span>{title}</span>
      {icon && <span>{icon}</span>}
    </button>
  );
};

export default CustomButton;
