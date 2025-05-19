"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CustomButton from "../../ui_components/CustomButton";
import { Divider } from "@mui/material";
import InputField from "../../ui_components/InputField";
// Import Firebase
import { auth, functions } from "../../config/firebase.jsx";
import {
  getStorage,
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
// Import QR Code library
import QRCode from "react-qr-code";

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
  supervisorId: yup.string().required("Supervisor is required"),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);

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
            // After getting admin data, fetch supervisors
            fetchSupervisors();
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

  // Fetch supervisors for the dropdown - now from main collection
  const fetchSupervisors = async () => {
    try {
      setLoadingSupervisors(true);
      const db = getFirestore();
      // Get supervisors from main collection instead of subcollection
      const supervisorsRef = collection(db, "supervisors");
      const supervisorsSnapshot = await getDocs(supervisorsRef);

      const supervisorsList = [];
      supervisorsSnapshot.forEach((doc) => {
        const supervisorData = doc.data();
        supervisorsList.push({
          value: supervisorData.uid,
          label: `${supervisorData.firstName} ${supervisorData.lastName} (${supervisorData.department})`,
          department: supervisorData.department,
        });
      });

      setSupervisors(supervisorsList);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
      setSubmitError("Failed to load supervisors list");
    } finally {
      setLoadingSupervisors(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      department: "",
      supervisorId: "",
      bio: "",
      email: "",
      phoneNumber: "",
      designation: "",
      hourlyRate: "",
      workingHours: "",
      overtimeRate: "",
    },
  });

  // Watch the department value to filter supervisors
  const selectedDepartment = watch("department");

  // Filter supervisors by department when department changes
  useEffect(() => {
    if (selectedDepartment) {
      // Reset supervisor field when department changes
      setValue("supervisorId", "");
    }
  }, [selectedDepartment, setValue]);

  // Function to generate QR code based on employee data and upload to Firebase Storage
  const generateAndUploadQRCode = async (employeeData) => {
    try {
      setGeneratingQR(true);

      // UPDATED: Create a QR code data format that is compatible with the QRCodeScreen
      // Include a unique identifier and the employee's ID for attendance tracking
      const qrData = JSON.stringify({
        type: "attendance", // Type identifier for QR scanner
        employeeId: employeeData.uid, // Employee ID for identification
        employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
        adminId: employeeData.adminId, // Admin ID for verification
        issuedAt: new Date().toISOString(), // When the QR code was generated
        // Set expiry to a far future date since this is a permanent employee QR code
        // In a production environment, you might want to rotate these periodically
        expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 1 year
        // Include a unique code that can be used to verify the QR code's authenticity
        verificationCode:
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15),
      });

      // Create a canvas element to render the QR code
      const canvas = document.createElement("canvas");
      const qrCodeElement = document.createElement("div");
      document.body.appendChild(qrCodeElement);

      // Create a temporary React component with the QR code
      const tempQrCode = React.createElement(QRCode, {
        value: qrData,
        size: 300,
        level: "H",
      });

      // Render the QR code
      const root = ReactDOM.createRoot(qrCodeElement);
      root.render(tempQrCode);

      // Wait a moment for the SVG to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Find the SVG element
      const svg = qrCodeElement.querySelector("svg");

      // Convert SVG to canvas
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();

      // Set crossOrigin to avoid CORS issues
      img.crossOrigin = "anonymous";

      // Wait for the image to load
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src =
          "data:image/svg+xml;base64," +
          btoa(unescape(encodeURIComponent(svgData)));
      });

      // Draw the image on the canvas
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Get the data URL from the canvas
      const dataUrl = canvas.toDataURL("image/png");

      // Clean up the temporary elements
      document.body.removeChild(qrCodeElement);

      // Upload to Firebase Storage
      const storage = getStorage();
      const qrRef = storageRef(
        storage,
        `employee-qrcodes/${employeeData.uid}.png`
      );

      // Remove the data URL prefix (data:image/png;base64,)
      const qrImageBase64 = dataUrl.split(",")[1];

      // Upload base64 image data
      await uploadString(qrRef, qrImageBase64, "base64", {
        contentType: "image/png",
      });

      // Get the download URL
      const qrCodeUrl = await getDownloadURL(qrRef);

      // Store the QR data in a field for future verification
      const qrDataForStorage = {
        type: "attendance",
        employeeId: employeeData.uid,
        adminId: employeeData.adminId,
        issuedAt: new Date().toISOString(),
        verificationCode: JSON.parse(qrData).verificationCode,
        qrCodeUrl: qrCodeUrl,
      };

      return { qrCodeUrl, qrData: qrDataForStorage };
    } catch (error) {
      console.error("Error generating or uploading QR code:", error);
      throw error;
    } finally {
      setGeneratingQR(false);
    }
  };

  // Generate a simple employee ID
  const generateEmployeeId = () => {
    const prefix = "EMP";
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomDigits}`;
  };

  // Check if admin ID is available
  const validateAdminContext = () => {
    if (!currentUser) {
      setSubmitError(
        "Authentication error: You must be logged in to add employees"
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

      // Get selected supervisor information
      const selectedSupervisor = supervisors.find(
        (sup) => sup.value === data.supervisorId
      );

      const employeeData = {
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        supervisorId: data.supervisorId,
        supervisorName: selectedSupervisor
          ? selectedSupervisor.label.split(" (")[0]
          : "",
        bio: data.bio || "",
        email: data.email,
        password: "123123", // Your static password
        phoneNumber: data.phoneNumber,
        designation: data.designation,
        hourlyRate: Number(data.hourlyRate),
        workingHours: Number(data.workingHours),
        overtimeRate: Number(data.overtimeRate),
        createdAt: new Date(),
        // Add the admin's ID who is creating this employee
        adminId: currentUser.uid,
        // Add isPasswordSet field set to false for new employees
        isPasswordSet: false,
        passwordLastChanged: null,
      };

      // Call the Cloud Function to create the employee
      const createNewEmployee = httpsCallable(functions, "createNewEmployee");
      const result = await createNewEmployee(employeeData);

      console.log("Employee added with Auth ID: ", result.data.uid);

      // Add the employee ID to the employee data
      const employeeWithId = {
        ...employeeData,
        uid: result.data.uid,
        employeeId: generateEmployeeId(), // Generate a simple employee ID
      };

      // Generate QR code for the employee and upload to Storage
      const { qrCodeUrl, qrData } = await generateAndUploadQRCode(
        employeeWithId
      );

      // Update the employee document with the QR code URL and data
      const employeeWithQR = {
        ...employeeWithId,
        qrCodeUrl: qrCodeUrl,
        qrCodeData: qrData,
        qrCodeGeneratedAt: new Date(),
      };

      // Save employee data to Firestore in the main employees collection
      const db = getFirestore();
      await setDoc(doc(db, "employees", result.data.uid), employeeWithQR);

      console.log("Employee created successfully with QR code:", qrCodeUrl);

      setSubmitSuccess(true);

      // Reset form after successful submission
      reset();
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error adding employee: ", error);
      setSubmitError(`Failed to add employee: ${error.message}`);
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

  // Filter supervisors based on selected department
  const filteredSupervisors = selectedDepartment
    ? supervisors.filter((sup) => sup.department === selectedDepartment)
    : supervisors;

  // Create supervisor options for dropdown
  const supervisorOptions = filteredSupervisors.map((sup) => ({
    value: sup.value,
    label: sup.label,
  }));

  return (
    <div className="p-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-black text-2xl">Add Employee</h2>
          <h4 className="mt-2 text-[#727A90]">
            Add new employee to the system
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
            title={
              isSubmitting || generatingQR
                ? "Processing..."
                : "Create New Employee"
            }
            style={"w-[200px] text-white h-10"}
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || generatingQR}
          />
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
          <span className="block sm:inline">
            Employee added successfully with QR code! Employee has been created
            with a default password.
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
                  label="Assign Supervisor"
                  dropdown={true}
                  register={register}
                  name="supervisorId"
                  error={errors.supervisorId}
                  required
                  options={supervisorOptions}
                  disabled={!selectedDepartment || loadingSupervisors}
                  placeholder={
                    loadingSupervisors
                      ? "Loading supervisors..."
                      : !selectedDepartment
                      ? "Select department first"
                      : filteredSupervisors.length === 0
                      ? "No supervisors for this department"
                      : "Select supervisor"
                  }
                />
                {selectedDepartment &&
                  filteredSupervisors.length === 0 &&
                  !loadingSupervisors && (
                    <p className="text-amber-600 text-xs mt-1">
                      No supervisors available for this department. Please add
                      supervisors first.
                    </p>
                  )}
              </div>
            </div>

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
            <strong>Note:</strong> New employees will be created with a default
            password. They will need to change it on their first login.
          </p>
        </div>

        <h1 className="text-xl font-semibold mt-10">Job & Salary Info</h1>
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
