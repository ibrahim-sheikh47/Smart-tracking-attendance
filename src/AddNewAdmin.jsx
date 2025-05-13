import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { Divider } from "@mui/material";
import { functions } from "./config/firebase";
import CustomButton from "./ui_components/CustomButton";
import InputField from "./ui_components/InputField";

// Validation schema
const validationSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
  department: yup.string().required("Department is required"),
  role: yup.string().required("Role is required"),
  phoneNumber: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
});

const AddNewAdmin = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    // eslint-disable-next-line no-unused-vars
    watch,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: "",
      role: "admin", // Default role
      phoneNumber: "",
    },
  });

  // Department options
  const departmentOptions = [
    { value: "hr", label: "HR" },
    { value: "it", label: "IT" },
    { value: "management", label: "Management" },
    { value: "support", label: "Support" },
    { value: "marketing", label: "Marketing" },
    { value: "finance", label: "Finance" },
    { value: "accounts", label: "Accounts" },
    { value: "sales", label: "Sales" },
  ];

  // Role options
  const roleOptions = [
    { value: "admin", label: "Admin" },
    { value: "superadmin", label: "Super Admin" },
  ];

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      // Prepare admin data
      const adminData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        department: data.department,
        phoneNumber: data.phoneNumber,
        isSuper: data.role === "superadmin",
      };

      // Call the Cloud Function to create the admin
      const createAdmin = httpsCallable(functions, "createAdmin");
      const result = await createAdmin(adminData);

      console.log("Admin created successfully:", result.data);
      setSubmitSuccess(true);

      // Reset form after successful submission
      reset();

      // Navigate back to admin management after short delay
      setTimeout(() => {
        navigate("/admin-management");
      }, 2000);
    } catch (error) {
      console.error("Error creating admin:", error);
      setSubmitError(`Failed to create admin: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-black text-2xl">Add Admin</h2>
          <h4 className="mt-2 text-[#727A90]">Create a new admin account</h4>
        </div>
        <div className="flex items-center gap-2">
          <CustomButton
            title="Cancel"
            style={
              "w-[120px] bg-[#F9F9F9] border border-[#D9DADF] text-black h-10"
            }
            onClick={() => navigate("/admin-management")}
          />
          <CustomButton
            title={isSubmitting ? "Processing..." : "Create Admin"}
            style={"w-[120px] text-white h-10"}
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
          <span className="block sm:inline">Admin created successfully!</span>
        </div>
      )}

      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
          <span className="block sm:inline">{submitError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-[#F9F9F9] px-8 py-6 mt-5 rounded-lg"
      >
        <h1 className="text-xl font-semibold">Admin Information</h1>
        <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

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

        <div className="flex gap-2 mt-4">
          <div className="flex-1">
            <InputField
              label="Email"
              type="email"
              placeholder="admin@example.com"
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

        <h1 className="text-xl font-semibold mt-8">Account Settings</h1>
        <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

        <div className="flex gap-2">
          <div className="flex-1">
            <InputField
              label="Department"
              dropdown={true}
              register={register}
              name="department"
              error={errors.department}
              required
              options={departmentOptions}
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Role"
              dropdown={true}
              register={register}
              name="role"
              error={errors.role}
              required
              options={roleOptions}
            />
          </div>
        </div>

        <h1 className="text-xl font-semibold mt-8">Security</h1>
        <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

        <div className="flex gap-2">
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
              placeholder="Confirm Password"
              register={register}
              name="confirmPassword"
              error={errors.confirmPassword}
              required
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddNewAdmin;
