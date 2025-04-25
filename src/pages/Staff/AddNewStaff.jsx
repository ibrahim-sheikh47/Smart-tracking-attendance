import React, { useState } from "react";
import CustomButton from "../../ui_components/CustomButton";
import { Divider } from "@mui/material";
import InputField from "../../ui_components/InputField";
import assets from "../../constants/assets";

const AddNewStaff = () => {
  // Manage form state using useState
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    bio: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    designation: "",
    hourlyRate: "",
    workingHours: "",
    overtimeRate: "",
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-black text-2xl">Add Employee</h2>
          <h4 className="mt-2 text-[#727A90]">EMP: #123456</h4>
        </div>
        <div className="flex items-center gap-2">
          <CustomButton
            title="Cancel"
            style={
              "w-[200px] bg-[#F9F9F9] border border-[#D9DADF] text-black h-10"
            }
            onClick={() => navigation("/manage-staff/AddNewStaff")}
          />
          <CustomButton
            title="Create New Employee"
            style={"w-[200px] text-white h-10"}
            onClick={() => navigation("/manage-staff/AddNewStaff")}
          />
        </div>
      </div>
      <form action="" className="bg-[#F9F9F9] px-8 py-6 mt-5 rounded-lg">
        <h1 className="text-xl font-semibold">Personal Info</h1>
        <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
        <div className="flex gap-5">
          <div className="w-[25%] flex items-center justify-center border border-gray-300 rounded-2xl">
            <img src={assets.placeholderDp} className="w-20 h-20" alt="" />
          </div>
          <div className="w-[75%] flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <InputField
                  label="First Name"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  name="firstName"
                  required
                />
              </div>
              <div className="flex-1">
                <InputField
                  label="Last Name"
                  placeholder="Doe"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  name="lastName"
                  required
                />
              </div>
            </div>

            <InputField
              label="Department"
              dropdown={true}
              value={formData.department}
              onChange={handleInputChange}
              name="department"
              required
              options={[
                { value: "hr", label: "HR" },
                { value: "finance", label: "Finance" },
                { value: "it", label: "IT" },
              ]}
            />

            <InputField
              placeholder="Enter Bio (Max 200 characters)"
              label="Bio"
              value={formData.bio}
              onChange={handleInputChange}
              name="bio"
              textarea
              required
            />
          </div>
        </div>

        <h1 className="text-xl font-semibold mt-5">Login Info</h1>
        <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

        <div className="flex gap-2">
          <div className="flex-1">
            <InputField
              label="Email"
              type="email"
              placeholder="Johndoe@gmail.com"
              value={formData.email}
              onChange={handleInputChange}
              name="email"
              required
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Phone Number"
              placeholder="Enter Phone Number"
              type="text"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              name="phoneNumber"
              required
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <div className="flex-1">
            <InputField
              label="Password"
              type="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleInputChange}
              name="password"
              required
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Confirm Password"
              type="password"
              placeholder="Enter Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              name="confirmPassword"
              required
            />
          </div>
        </div>

        <h1 className="text-xl font-semibold mt-5">Job & Salary Info</h1>
        <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

        <div className="flex gap-2">
          <div className="flex-1">
            <InputField
              label="Designation"
              type="text"
              placeholder="Enter Designation"
              value={formData.designation}
              onChange={handleInputChange}
              name="designation"
              required
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Hourly Rate"
              placeholder="Define hourly rate"
              type="text"
              value={formData.hourlyRate}
              onChange={handleInputChange}
              name="hourlyRate"
              required
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <div className="flex-1">
            <InputField
              label="Working Hours / Week"
              type="text"
              placeholder="Enter working hours per week"
              value={formData.workingHours}
              onChange={handleInputChange}
              name="workingHours"
              required
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Overtime Hourly Rate"
              type="text"
              placeholder="Enter overtime hourly rate"
              value={formData.overtimeRate}
              onChange={handleInputChange}
              name="overtimeRate"
              required
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddNewStaff;
