// src/ui_components/InputField.js
import React from "react";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";

const InputField = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  className,
  textarea,
  name,
  options, // Added options for dropdown
  dropdown, // Added dropdown flag
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm text-[#0F172A] font-medium">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="border border-[#CBD5E1] rounded-lg p-2 bg-white placeholder:text-[#94A3B8] hover:border-[#098B71] focus:outline-[#098B71]"
          name={name}
          rows="3" // Set rows to 5
          cols="30" // Set cols to 40
          maxLength={200}
        ></textarea>
      ) : dropdown ? ( // If dropdown is true, render a select element
        <div className="relative w-full">
          <select
            value={value}
            onChange={onChange}
            required={required}
            className="border border-[#CBD5E1] rounded-lg p-2 bg-white placeholder:text-[#94A3B8] hover:border-[#098B71] focus:outline-[#098B71] appearance-none pr-10 w-full cursor-pointer" // Added pr-10 for padding-right
            name={name}
          >
            {options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom down icon (you can replace it with an icon of your choice) */}
          <span className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 cursor-pointer">
            <KeyboardArrowDownOutlinedIcon />
          </span>
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="border border-[#CBD5E1] rounded-lg h-10 w-full p-2 bg-white placeholder:text-[#94A3B8] hover:border-[#098B71] focus:outline-[#098B71]"
          name={name}
        />
      )}
    </div>
  );
};

export default InputField;
