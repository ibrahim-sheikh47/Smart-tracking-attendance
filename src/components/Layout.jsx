// components/Layout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar  />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
