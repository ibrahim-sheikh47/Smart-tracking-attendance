"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CustomButton from "../../ui_components/CustomButton.jsx";
import { Divider } from "@mui/material";
import InputField from "../../ui_components/InputField.jsx";
// Import Firebase
import { auth, functions } from "../../config/firebase.jsx";
import { httpsCallable } from "firebase/functions";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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
  designation: yup.string().required("Designation is required"),
  monthlySalary: yup
    .number()
    .typeError("Monthly salary must be a number")
    .positive("Monthly salary must be positive")
    .required("Monthly salary is required"),
});

const AddNewSupervisor = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [currentAdmin, setCurrentAdmin] = useState(null);

  const currentUser = auth.currentUser;

  // Get current admin information to use their ID
  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      if (currentUser) {
        try {
          const db = getFirestore();
          const adminDocRef = doc(db, "admins", currentUser.uid);
          const adminDocSnap = await getDoc(adminDocRef);

          if (adminDocSnap.exists()) {
            setCurrentAdmin(adminDocSnap.data());
            console.log("Current admin data:", adminDocSnap.data());
          } else {
            console.error("No admin document found for current user");
            setSubmitError("Authentication error: Admin profile not found");
          }
        } catch (error) {
          console.error("Error fetching admin data:", error);
        }
      }
    };

    fetchCurrentAdmin();
  }, [currentUser]);

  const {
    register,
    handleSubmit,
    reset,
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
      designation: "",
      monthlySalary: "",
    },
  });

  // Generate a simple supervisor ID
  const generateSupervisorId = () => {
    const prefix = "SUP";
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomDigits}`;
  };

  // Check if admin ID is available
  const validateAdminContext = () => {
    if (!currentUser) {
      setSubmitError(
        "Authentication error: You must be logged in to add supervisors"
      );
      return false;
    }

    if (!currentAdmin) {
      setSubmitError("Authentication error: Admin profile not found");
      return false;
    }

    return true;
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Validate admin context first
      if (!validateAdminContext()) {
        return;
      }

      setIsSubmitting(true);
      setSubmitError("");

      const supervisorData = {
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        bio: data.bio || "",
        email: data.email,
        password: "123123", // Your static password
        phoneNumber: data.phoneNumber,
        designation: data.designation,
        monthlySalary: Number(data.monthlySalary),
        createdAt: new Date(),
        // Add the admin's ID who is creating this supervisor
        adminId: currentUser.uid,
        // Add isPasswordSet field set to false for new supervisors
        isPasswordSet: false,
        passwordLastChanged: null,
      };

      // Call the Cloud Function to create the supervisor account
      const createNewSupervisor = httpsCallable(
        functions,
        "createNewSupervisor"
      );
      const result = await createNewSupervisor(supervisorData);

      console.log("Supervisor added with Auth ID: ", result.data.uid);

      // Add the supervisor ID to the supervisor data
      const supervisorWithId = {
        ...supervisorData,
        uid: result.data.uid,
        supervisorId: generateSupervisorId(), // Generate a simple supervisor ID
        teamMembers: [], // Initialize empty team members array
      };

      // Save supervisor data to Firestore in the main collection
      const db = getFirestore();
      await setDoc(doc(db, "supervisors", result.data.uid), supervisorWithId);

      console.log("Supervisor created successfully");

      setSubmitSuccess(true);

      // Reset form after successful submission
      reset();
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error adding supervisor: ", error);
      setSubmitError(`Failed to add supervisor: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-black text-2xl">Add Supervisor</h2>
          <h4 className="mt-2 text-[#727A90]">
            Add new supervisor to the system
          </h4>
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
            title={isSubmitting ? "Processing..." : "Create New Supervisor"}
            style={"w-[200px] text-white h-10"}
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
          <span className="block sm:inline">
            Supervisor added successfully! Supervisor has been created with a
            default password.
          </span>
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
        <h1 className="text-xl font-semibold">Personal Info</h1>
        <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
        <div className="flex gap-5">
          <div className="w-full flex flex-col gap-3">
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

        <div className="mt-2 text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
          <p className="text-sm">
            <strong>Note:</strong> New supervisors will be created with a
            default password. They will need to change it on their first login.
          </p>
        </div>

        <h1 className="text-xl font-semibold mt-10">Supervisor Details</h1>
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
              label="Monthly Salary"
              type="number"
              placeholder="Enter monthly salary"
              register={register}
              name="monthlySalary"
              error={errors.monthlySalary}
              required
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddNewSupervisor;
