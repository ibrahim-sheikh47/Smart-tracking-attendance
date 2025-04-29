import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CustomButton from "../../ui_components/CustomButton";
import { Divider } from "@mui/material";
import InputField from "../../ui_components/InputField";
// import assets from "../../constants/assets";
// Import Firebase
import { auth, functions} from "../../config/firebase.jsx";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, CameraAlt, DeleteOutline } from "@mui/icons-material";

import {httpsCallable } from "firebase/functions";

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
  // const [profileImage, setProfileImage] = useState(null);
  // const [profileImageUrl, setProfileImageUrl] = useState("");
  // const [uploadingImage, setUploadingImage] = useState(false);
  // const fileInputRef = useRef(null);

  const currentUser = auth.currentUser;
  React.useEffect(() => {
    console.log("Current user on page load:", currentUser);
  }, []);

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
      hourlyRate: "",
      workingHours: "",
      overtimeRate: "",
    },
  });

  // Initialize Firebase Storage

  // Handle image selection
  // const handleImageChange = (e) => {
  //   if (e.target.files[0]) {
  //     const selectedImage = e.target.files[0];
  //     setProfileImage(selectedImage);
  //     // Create a preview URL
  //     //setProfileImageUrl(URL.createObjectURL(selectedImage));
  //     setProfileImageUrl("https://firebasestorage.googleapis.com/v0/b/hoc-smart-attendance.firebasestorage.app/o/portrait_ali_lal_din_full.jpg?alt=media&token=47306f85-c251-4337-b368-3376a9307c14");
  //   }
  // };
  //
  // // Handle image upload to Firebase Storage
  // const uploadImageToFirebase = async (id) => {
  //   if (!profileImage) return null;
  //
  //   try {
  //     setUploadingImage(true);
  //
  //     // Get file extension
  //     const fileExtension = profileImage.name.split('.').pop();
  //
  //     const imageRef = ref(storage, `profile-images/${id}.${fileExtension}`);
  //
  //     // Upload the image
  //     const snapshot = await uploadBytes(imageRef, profileImage);
  //
  //     // Get the download URL
  //     const downloadURL = await getDownloadURL(snapshot.ref);
  //
  //     return downloadURL;
  //   } catch (error) {
  //     console.error("Error uploading image: ", error);
  //     throw error;
  //   } finally {
  //     setUploadingImage(false);
  //   }
  // };
  //
  // // Handle clicking the image area to trigger file input
  // const handleImageClick = () => {
  //   fileInputRef.current.click();
  // };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      // Upload profile image if available
      // let imageUrl = null;
      // if (profileImage) {
      //   imageUrl = await uploadImageToFirebase(Date.now().toString()); // Use timestamp as temporary ID
      // }

      // Prepare employee data
      const employeeData = {
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        bio: data.bio || "",
        email: data.email,
        password: "123123", // Your static password
        phoneNumber: data.phoneNumber,
        designation: data.designation,
        hourlyRate: Number(data.hourlyRate),
        workingHours: Number(data.workingHours),
        overtimeRate: Number(data.overtimeRate),
        // profileImageUrl: imageUrl || "",
      };

      // Call the Cloud Function
      const createNewEmployee = httpsCallable(functions, 'createNewEmployee');
      const result = await createNewEmployee(employeeData);

      // If successful and we have image but used timestamp for upload, we might want to rename it
      // if (result.data.success && profileImage && imageUrl) {
      //   // Optionally update the image path using the new UID
      //   // This would require another function to move the file in storage
      //   // or you could just leave it with the timestamp name
      // }

      console.log("Employee added with Auth ID: ", result.data.uid);


      setSubmitSuccess(true);

      // Reset form after successful submission
      reset();
      // setProfileImage(null);
      // setProfileImageUrl("");

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
      console.log(auth.currentUser);

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
            title={isSubmitting ? "Submitting..." : "Create New Employee"}
            style={"w-[200px] text-white h-10"}
            onClick={handleSubmit(onSubmit)}
            // disabled={isSubmitting || uploadingImage}
          />
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
          <span className="block sm:inline">Employee added successfully!</span>
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
          {/*<div*/}
          {/*  className="w-[25%] flex flex-col items-center justify-center gap-3 border border-gray-300 rounded-2xl cursor-pointer h-70 hover:bg-green-50 mb-1 relative"*/}
          {/*  onClick={handleImageClick}*/}
          {/*>*/}
          {/*  {profileImageUrl ? (*/}
          {/*    <>*/}
          {/*      <div className="relative w-full h-full overflow-hidden rounded-2xl">*/}
          {/*        <img*/}
          {/*          src={profileImageUrl}*/}
          {/*          className="w-full h-full object-cover"*/}
          {/*          alt="Profile Preview"*/}
          {/*        />*/}
          {/*        <div*/}
          {/*          className="absolute bottom-1 right-1 bg-green-500 w-7 h-7 flex justify-center items-center rounded-full cursor-pointer"*/}
          {/*          onClick={(e) => {*/}
          {/*            e.stopPropagation();*/}
          {/*            handleImageClick();*/}
          {/*          }}*/}
          {/*        >*/}
          {/*          <CameraAlt fontSize="x-small" className="text-white" />*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*    </>*/}
          {/*  ) : (*/}
          {/*    <>*/}
          {/*      <img src={assets.placeholderDp} className="w-20 h-20" alt="" />*/}
          {/*      <p className="text-sm font-bold text-[#3DC296]">Upload Image</p>*/}
          {/*    </>*/}
          {/*  )}*/}
          {/*  <input*/}
          {/*    type="file"*/}
          {/*    ref={fileInputRef}*/}
          {/*    onChange={handleImageChange}*/}
          {/*    accept="image/*"*/}
          {/*    className="hidden"*/}
          {/*  />*/}
          {/*</div>*/}
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