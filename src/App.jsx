import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { Auth } from "./components/auth";
import Dashboard from "./pages/Dashboard";
import ManageStaff from "./pages/Staff/ManageStaff";
import AddNewStaff from "./pages/Staff/AddNewStaff";
import ImgTest from "./ImgTest";
import Reports from "./pages/Reports/StaffReport";
import AttendanceHistory from "./pages/Reports/AttendanceHistory";
import Payroll from "./pages/Payroll/Payroll";
import PayrollDetails from "./pages/Payroll/PayrollDetails";
import SettingsPage from "./pages/Settings/Settings.jsx";

// Placeholder components
const Settings = () => <div className="p-6">Settings Content</div>;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
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

  return (
    <Router>
      {user ? (
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/manage-staff" element={<ManageStaff />} />
            <Route path="/manage-staff/AddNewStaff" element={<AddNewStaff />} />
            <Route path="/dashboard/ImgTest" element={<ImgTest />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/payroll/payroll-detail/:employeeId" element={<PayrollDetails />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/reports" element={<Reports />} />

            <Route
              path="/reports/:employeeId/history"
              element={<AttendanceHistory />}
            />

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
