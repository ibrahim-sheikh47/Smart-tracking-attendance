import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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
function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

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
            setUserRole(adminData.isSuper ? "superadmin" : "admin");
          } else {
            // Check if user is an employee
            const employeeDocRef = doc(firestoreDb, "employees", user.uid);
            const employeeDocSnap = await getDoc(employeeDocRef);

            if (employeeDocSnap.exists()) {
              setUserRole("employee");
            } else {
              // User not found in any collection
              setUserRole("unknown");
            }
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          setUserRole("unknown");
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="animate-spin w-[max-content] m-auto mt-32">
        Loading...
      </div>
    );

  // Function to check if user has access to a route
  const hasAccess = (requiredRoles) => {
    if (!requiredRoles) return true; // No role restrictions
    if (!userRole) return false; // User has no role
    return requiredRoles.includes(userRole);
  };

  return (
    <Router>
      {user ? (
        <Layout userRole={userRole}>
          <Routes>
            {/* Routes accessible to all authenticated users */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Routes accessible to admins and super admins */}
            {hasAccess(["admin", "superadmin"]) && (
              <>
                <Route path="/manage-staff" element={<ManageStaff />} />
                <Route path="/manage-staff/AddNewStaff" element={<AddNewStaff />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/payroll/payroll-detail/:id" element={<PayrollDetails />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/:employeeId/history" element={<AttendanceHistory />} />
              </>
            )}

            {/* Routes accessible only to super admins */}
            {hasAccess(["superadmin"]) && (
              <>
                <Route path="/admin-management" element={<AdminManagement />} />
                <Route path="/admin-management/add-new-admin" element={<AddNewAdmin />} />
              </>
            )}


            {/* Default routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="*" element={<Auth />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;