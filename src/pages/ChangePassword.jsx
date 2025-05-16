import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, firestoreDb } from "../config/firebase";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import assets from "../constants/assets.jsx";

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const adminId = location.state?.adminId || sessionStorage.getItem("adminId");
  const isPasswordReset = location.state?.isPasswordReset || false;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case "current":
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case "new":
        setShowNewPassword(!showNewPassword);
        break;
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const validatePasswords = () => {
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return false;
    }

    // Check password length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        setError("User not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Update password in Firebase Auth
      await updatePassword(user, newPassword);

      // Update isPasswordSet field in Firestore
      const adminRef = doc(firestoreDb, "admins", adminId);
      await updateDoc(adminRef, {
        isPasswordSet: true,
      });

      // Clear the password change flag in session storage
      sessionStorage.removeItem("passwordNeedsChange");

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect");
      } else {
        setError(`Failed to change password: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-4 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
        <div>
          <img src={assets.HocLogo} className="mx-auto h-32" alt="HOC Logo" />
          <h2 className="my-4 text-center text-2xl font-bold tracking-tight text-gray-900">
            KMC Daily Pay
          </h2>

          {isPasswordReset && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You are using a default password. Please change your
                    password before continuing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-green-700">
                Password changed successfully! Redirecting...
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handlePasswordChange} className="mt-6 space-y-6">
          <div className="relative">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Current Password
            </label>
            <div className="mt-1 relative">
              <input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showCurrentPassword ? (
                  <VisibilityIcon fontSize="small" className="text-gray-500" />
                ) : (
                  <VisibilityOffIcon
                    fontSize="small"
                    className="text-gray-500"
                  />
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <div className="mt-1 relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showNewPassword ? (
                  <VisibilityIcon fontSize="small" className="text-gray-500" />
                ) : (
                  <VisibilityOffIcon
                    fontSize="small"
                    className="text-gray-500"
                  />
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <VisibilityIcon fontSize="small" className="text-gray-500" />
                ) : (
                  <VisibilityOffIcon
                    fontSize="small"
                    className="text-gray-500"
                  />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
              onClick={() => navigate(-1)}
              disabled={isPasswordReset || loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-white font-medium text-sm disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Changing Password..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
