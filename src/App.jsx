import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Layout from "./components/Layout";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestoreDb } from "./config/firebase";
import { doc, getDoc } from "firebase/firestore";

import AdminManagement from "./AdminManagement.jsx";
import AddNewAdmin from "./AddNewAdmin.jsx";
import { Auth } from "./components/auth";
import Dashboard from "./pages/Dashboard";
import ManageStaff from "./pages/Staff/ManageStaff";
import AddNewStaff from "./pages/Staff/AddNewStaff";
import Reports from "./pages/Reports/StaffReport";
import AttendanceHistory from "./pages/Reports/AttendanceHistory";
import Payroll from "./pages/Payroll/Payroll";
import PayrollDetails from "./pages/Payroll/PayrollDetails";
import SettingsPage from "./pages/Settings/Settings.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import UploadFile from "./ImgTest.jsx";
import ManageSuperVisor from "./pages/SuperVisor/ManageSuperVisor.jsx";
import AddNewSupervisor from "./pages/SuperVisor/AddNewSupervisor.jsx";
import PayrollAdminSummary from "./components/PayrollSummary.jsx";

// Component to enforce password change
function PasswordChangeRedirect({ children, passwordNeedsChange }) {
  const location = useLocation();

  if (passwordNeedsChange && location.pathname !== "/settings/change-pass") {
    return <Navigate to="/settings/change-pass" replace />;
  }

  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordNeedsChange, setPasswordNeedsChange] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        try {
          // First check if user is an admin
          const adminDocRef = doc(firestoreDb, "admins", user.uid);
          const adminDocSnap = await getDoc(adminDocRef);

          if (adminDocSnap.exists()) {
            // User is an admin
            const adminData = adminDocSnap.data();
            const role = adminData.isSuper ? "superadmin" : "admin";
            setUserRole(role);
            console.log("User authenticated with role:", role);

            // Check if the password needs to be changed
            if (adminData.isPasswordSet === false) {
              console.log("Password change needed:", true);
              sessionStorage.setItem("passwordNeedsChange", "true");
              sessionStorage.setItem("adminId", user.uid);
              setPasswordNeedsChange(true);
            } else {
              sessionStorage.removeItem("passwordNeedsChange");
              setPasswordNeedsChange(false);
            }
          } else {
            // Check if user is an employee
            const employeeDocRef = doc(firestoreDb, "employees", user.uid);
            const employeeDocSnap = await getDoc(employeeDocRef);

            if (employeeDocSnap.exists()) {
              setUserRole("employee");
              sessionStorage.removeItem("passwordNeedsChange");
              setPasswordNeedsChange(false);
            } else {
              // User not found in any collection
              setUserRole("unknown");
              // Sign out users who don't belong to any valid collection
              auth.signOut();
            }
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          setUserRole("unknown");
          // Sign out on error
          auth.signOut();
        }
      } else {
        setUser(null);
        setUserRole(null);
        setPasswordNeedsChange(false);
        sessionStorage.removeItem("passwordNeedsChange");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Effect to check session storage for password change flag
  useEffect(() => {
    const checkPasswordChangeStatus = () => {
      const needsChange =
        sessionStorage.getItem("passwordNeedsChange") === "true";
      setPasswordNeedsChange(needsChange);
      console.log("Password needs change status updated:", needsChange);
    };

    // Initial check
    checkPasswordChangeStatus();

    // Set up event listener for storage changes
    window.addEventListener("storage", checkPasswordChangeStatus);

    // Custom event listener for our app
    const handlePasswordChangeEvent = () => {
      checkPasswordChangeStatus();
    };
    window.addEventListener("passwordChanged", handlePasswordChangeEvent);

    return () => {
      window.removeEventListener("storage", checkPasswordChangeStatus);
      window.removeEventListener("passwordChanged", handlePasswordChangeEvent);
    };
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3DC296]"></div>
      </div>
    );

  return (
    <Router>
      {user ? (
        userRole === "employee" ? (
          <div className="text-center mt-32 text-xl text-red-600">
            Unauthorized Access. Contact Admin.
          </div>
        ) : (
          <Layout userRole={userRole}>
            <PasswordChangeRedirect passwordNeedsChange={passwordNeedsChange}>
              <Routes>
                {/* Common routes for both admin types */}
                <Route
                  path="/settings/change-pass"
                  element={
                    <ChangePassword
                      onPasswordChanged={() => {
                        setPasswordNeedsChange(false);
                        window.dispatchEvent(new Event("passwordChanged"));
                      }}
                    />
                  }
                />

                {/* Common routes for both admin types */}
                <Route
                  path="/settings/change-pass"
                  element={
                    <ChangePassword
                      onPasswordChanged={() => {
                        setPasswordNeedsChange(false);
                        window.dispatchEvent(new Event("passwordChanged"));
                      }}
                    />
                  }
                />

                {/* Routes accessible to both admin types */}
                {(userRole === "admin" || userRole === "superadmin") && (
                  <>
                    <Route path="/manage-staff" element={<ManageStaff />} />
                    <Route
                      path="/manage-staff/AddNewStaff"
                      element={<AddNewStaff />}
                    />
                    <Route path="/payroll" element={<Payroll />} />
                    <Route
                      path="/payroll/payroll-detail/:id"
                      element={<PayrollDetails />}
                    />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route
                      path="/reports/:employeeId/history"
                      element={<AttendanceHistory />}
                    />
                    <Route path="/test" element={<UploadFile />} />
                  </>
                )}

                {/* Routes accessible to regular admins only */}
                {userRole === "admin" && (
                  <>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                      path="/manage-supervisor"
                      element={<ManageSuperVisor />}
                    />
                    <Route
                      path="/manage-supervisor/AddNewSupervisor"
                      element={<AddNewSupervisor />}
                    />
                  </>
                )}

                {/* Routes accessible only to super admins */}
                {userRole === "superadmin" && (
                  <>
                    <Route
                      path="/admin-management"
                      element={<AdminManagement />}
                    />
                    <Route
                      path="/admin-management/add-new-admin"
                      element={<AddNewAdmin />}
                    />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                      path="/manage-supervisor"
                      element={<ManageSuperVisor />}
                    />
                    <Route
                      path="/manage-supervisor/AddNewSupervisor"
                      element={<AddNewSupervisor />}
                    />
                  </>
                )}

                {/* Default routes - route to appropriate landing page based on role */}
                <Route
                  path="/"
                  element={
                    userRole === "superadmin" ? (
                      <Navigate to="/admin-management" replace />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />

                {/* Catch-all routes */}
                <Route
                  path="*"
                  element={
                    userRole === "superadmin" ? (
                      <Navigate to="/admin-management" replace />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
              </Routes>
            </PasswordChangeRedirect>
          </Layout>
        )
      ) : (
        <Routes>
          <Route path="*" element={<Auth />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
