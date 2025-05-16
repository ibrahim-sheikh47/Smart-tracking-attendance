import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth, firestoreDb } from "../config/firebase.jsx";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import assets from "../constants/assets.jsx";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginMode, setLoginMode] = useState("superadmin");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateCredentials = async () => {
    setLoading(true);
    setError(null);

    try {
      // First check if the email exists in the appropriate collection
      const adminsRef = collection(firestoreDb, "admins");
      const emailQuery = query(adminsRef, where("email", "==", email));
      const querySnapshot = await getDocs(emailQuery);

      // If no matching admin found, show error
      if (querySnapshot.empty) {
        setError("No administrator account found with this email");
        setLoading(false);
        return;
      }

      // Get the admin document data
      const adminDoc = querySnapshot.docs[0];
      const adminData = adminDoc.data();
      const isSuper = adminData.isSuper === true;
      const isFirstLogin = adminData.isFirstLogin === true;
      const isPasswordSet = adminData.isPasswordSet === true; // Ensure explicit boolean comparison

      console.log("Admin login data:", {
        email,
        isSuper,
        isFirstLogin,
        isPasswordSet,
        adminId: adminDoc.id,
      });

      // Check if the login mode matches the admin type
      if (loginMode === "admin" && isSuper) {
        setError(
          "This email belongs to a Super Admin account. Please select Super Admin to continue."
        );
        setLoading(false);
        return;
      }

      if (loginMode === "superadmin" && !isSuper) {
        setError(
          "This email belongs to a regular Admin account. Please select Admin to continue."
        );
        setLoading(false);
        return;
      }

      // If we've passed all checks, now attempt to sign in
      await signInWithEmailAndPassword(auth, email, password);

      // Store the admin ID, password status, and isSuper status in sessionStorage
      sessionStorage.setItem("adminId", adminDoc.id);
      sessionStorage.setItem("passwordNeedsChange", isPasswordSet === false);
      sessionStorage.setItem("isSuper", isSuper);

      console.log("Password set status:", isPasswordSet);

      // If password needs to be changed, redirect to password change page
      // If password needs to be changed AND the user is NOT a super admin
      if (isPasswordSet === false && !isSuper) {
        alert("Password not set, redirecting to change password page");
        navigate("/change-pass", {
          state: {
            adminId: adminDoc.id,
            isPasswordReset: true,
          },
        });
        setLoading(false);
        return;
      }

      // If it's the first login, redirect to settings page
      if (isFirstLogin) {
        // Navigate to settings page with first login flag
        navigate("/settings", {
          state: {
            isFirstLogin: true,
            adminId: adminDoc.id,
          },
        });
      } else {
        // Navigate to dashboard or home page
        navigate("/dashboard");
      }

      setLoading(false);
      console.log(
        "Authentication successful as",
        isSuper ? "Super Admin" : "Admin"
      );
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError(
          error.message || "Failed to sign in. Please check your credentials."
        );
      }
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-4 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md">
        <div>
          <img src={assets.HocLogo} className="mx-auto h-48" alt="HOC Logo" />
          <h2 className="my-2 text-center text-3xl font-bold tracking-tight text-gray-900">
            KMC DAILY PAY
          </h2>

          <div className="flex justify-center my-6 space-x-6">
            <button
              onClick={() => setLoginMode("superadmin")}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
                loginMode === "superadmin"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Super Admin
            </button>
            <button
              onClick={() => setLoginMode("admin")}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
                loginMode === "admin"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Admin
            </button>
          </div>

          <p className="my-4 text-center text-sm text-gray-600">
            {loginMode === "admin"
              ? "Sign in to access the admin dashboard"
              : "Sign in to manage admin accounts"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-2 space-y-5">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                placeholder="Email address"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="relative block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateCredentials();
                  }
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
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

          <div>
            <button
              onClick={validateCredentials}
              disabled={loading}
              className={`group relative flex w-full justify-center rounded-md cursor-pointer ${
                loginMode === "admin"
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-purple-600 hover:bg-purple-500"
              } py-2 px-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                loginMode === "admin"
                  ? "focus-visible:outline-blue-600"
                  : "focus-visible:outline-purple-600"
              } ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              {loading
                ? "Signing in..."
                : `Sign in as ${
                    loginMode === "admin" ? "Admin" : "Super Admin"
                  }`}
            </button>
          </div>
        </div>
        <div className="mt-10">
          <img src={assets.HocLogoDesc} className="w-[70%]" alt="" />
        </div>
      </div>
    </div>
  );
};
