import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CustomButton from "../../ui_components/CustomButton";
import { Divider } from "@mui/material";
import InputField from "../../ui_components/InputField";
import assets from "../../constants/assets";

// Define validation schema with Yup
const validationSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  department: yup.string().required("Department is required"),
  bio: yup.string().max(200, "Bio must not exceed 200 characters"),
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Email is required"),
  phoneNumber: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password"), null], "Passwords must match"),
  designation: yup.string().required("Designation is required"),
  hourlyRate: yup
    .number()
    .typeError("Hourly rate must be a number")
    .positive("Hourly rate must be positive")
    .required("Hourly rate is required"),
  workingHours: yup
    .number()
    .typeError("Working hours must be a number")
    .positive("Working hours must be positive")
    .max(168, "Working hours cannot exceed 168 hours per week")
    .required("Working hours is required"),
  overtimeRate: yup
    .number()
    .typeError("Overtime rate must be a number")
    .positive("Overtime rate must be positive")
    .required("Overtime rate is required"),
});

const AddNewStaff = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
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
    },
  });

  // Handle form submission
  const onSubmit = (data) => {
    console.log("Form submitted:", data);
    // Here you would typically send data to an API
  };

  // Department options
  const departmentOptions = [
    { value: "hr", label: "HR" },
    { value: "finance", label: "Finance" },
    { value: "it", label: "IT" },
  ];

  console.log("rerender");
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
            onClick={() => window.history.back()}
          />
          <CustomButton
            title="Create New Employee"
            style={"w-[200px] text-white h-10"}
            onClick={handleSubmit(onSubmit)}
          />
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-[#F9F9F9] px-8 py-6 mt-5 rounded-lg"
      >
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
                  register={register}
                  name="firstName"
                  error={errors.firstName}
                  required
                />
              </div>
              <div className="flex-1">
                <InputField
                  label="Last Name"
                  placeholder="Doe"
                  type="text"
                  register={register}
                  name="lastName"
                  error={errors.lastName}
                  required
                />
              </div>
            </div>

            <InputField
              label="Department"
              dropdown={true}
              register={register}
              name="department"
              error={errors.department}
              required
              options={departmentOptions}
            />

            <InputField
              placeholder="Enter Bio (Max 200 characters)"
              label="Bio"
              register={register}
              name="bio"
              error={errors.bio}
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
              register={register}
              name="email"
              error={errors.email}
              required
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Phone Number"
              placeholder="Enter Phone Number"
              type="tel"
              register={register}
              name="phoneNumber"
              error={errors.phoneNumber}
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
              register={register}
              name="password"
              error={errors.password}
              required
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Confirm Password"
              type="password"
              placeholder="Enter Password"
              register={register}
              name="confirmPassword"
              error={errors.confirmPassword}
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
              register={register}
              name="designation"
              error={errors.designation}
              required
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Hourly Rate"
              placeholder="Define hourly rate"
              type="number"
              register={register}
              name="hourlyRate"
              error={errors.hourlyRate}
              required
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <div className="flex-1">
            <InputField
              label="Working Hours / Week"
              type="number"
              placeholder="Enter working hours per week"
              register={register}
              name="workingHours"
              error={errors.workingHours}
              required
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Overtime Hourly Rate"
              type="number"
              placeholder="Enter overtime hourly rate"
              register={register}
              name="overtimeRate"
              error={errors.overtimeRate}
              required
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddNewStaff;
