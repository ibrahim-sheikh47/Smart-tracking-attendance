// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import {Auth} from "./components/auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// Placeholder components for other pages
const ManageStaff = () => <div className="p-6">Manage Staff Content</div>;
const Payroll = () => <div className="p-6">Payroll Content</div>;
const Reports = () => <div className="p-6">Reports Content</div>;
const Settings = () => <div className="p-6">Settings Content</div>;
const DashboardContent = () => <div className="p-6">Dashboard Content</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
      {/*<Layout>*/}
      {/*  <Routes>*/}
      {/*    <Route path="/dashboard" element={<DashboardContent />} />*/}
      {/*    <Route path="/manage-staff" element={<ManageStaff />} />*/}
      {/*    <Route path="/payroll" element={<Payroll />} />*/}
      {/*    <Route path="/reports" element={<Reports />} />*/}
      {/*    <Route path="/settings" element={<Settings />} />*/}
      {/*  </Routes>*/}
      {/*</Layout>*/}
    </Router>
  );
}

export default App;