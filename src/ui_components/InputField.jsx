import React from "react";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";

const InputField = ({
  label,
  type,
  minLength,
  value,
  onChange,
  placeholder,
  required,
  className,
  textarea,
  name,
  options,
  dropdown,
  register, // Added for react-hook-form
  error, // Added to display error message
  disabled, // Added disabled prop
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm text-[#0F172A] font-medium">{label}</label>
      {textarea ? (
        <div className="w-full">
          <textarea
            {...(register ? register(name) : { value, onChange, name })}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`border ${
              error ? "border-red-500" : "border-[#CBD5E1]"
            } rounded-lg p-2 bg-white placeholder:text-[#94A3B8] hover-border-green focus:outline-[#3DC296] w-full ${
              disabled ? "bg-gray-100 cursor-not-allowed opacity-75" : ""
            }`}
            rows="3"
            cols="30"
            maxLength={200}
          />

          {error && (
            <p className="text-red-500 text-xs mt-1">{error.message}</p>
          )}
        </div>
      ) : dropdown ? (
        <div className="relative w-full">
          <select
            {...(register ? register(name) : { value, onChange, name })}
            required={required}
            disabled={disabled}
            className={`border ${
              error ? "border-red-500" : "border-[#CBD5E1]"
            } rounded-lg p-2 bg-white placeholder:text-[#94A3B8] hover-border-green focus:outline-[#3DC296] appearance-none pr-10 w-full cursor-pointer ${
              disabled ? "bg-gray-100 cursor-not-allowed opacity-75" : ""
            }`}
          >
            <option value="">Select {label}</option>
            {options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
            <KeyboardArrowDownOutlinedIcon />
          </span>
          {error && (
            <p className="text-red-500 text-xs mt-1">{error.message}</p>
          )}
        </div>
      ) : (
        <div className="w-full">
          <input
            minLength={minLength}
            type={type}
            {...(register ? register(name) : { value, onChange, name })}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`border ${
              error ? "border-red-500" : "border-[#CBD5E1]"
            } rounded-lg h-10 w-full p-2 bg-white placeholder:text-[#94A3B8] hover:border-[#3DC296] focus:outline-[#3DC296] ${
              disabled ? "bg-gray-100 cursor-not-allowed opacity-75" : ""
            }`}
          />
          {error && (
            <p className="text-red-500 text-xs mt-1">{error.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InputField;
