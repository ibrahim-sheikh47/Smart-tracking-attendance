// components/Sidebar.jsx
import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import assets from "../constants/assets";
import CustomButton from "../ui_components/CustomButton";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
const Sidebar = ({ userRole }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Base menu items
  const baseMenuItems = [
    { text: "Dashboard", icon: assets.sidebarIcon1, path: "/dashboard" },
    {
      text: "Manage Supervisors",
      icon: <SupervisorAccountOutlinedIcon />,
      path: "/manage-supervisor",
    },
    {
      text: "Manage Employees",
      icon: assets.sidebarIcon2,
      path: "/manage-staff",
    },
    { text: "Payroll", icon: assets.sidebarIcon3, path: "/payroll" },
    { text: "Reports", icon: assets.sidebarIcon4, path: "/reports" },
    { text: "Settings", icon: assets.sidebarIcon5, path: "/settings" },
  ];

  // Super admin specific menu item

  // Determine which menu items to show based on user role
  // Determine which menu items to show based on user role
  const menuItems =
    userRole === "superadmin"
      ? [
          {
            text: "Admin Management",
            icon: <AdminPanelSettingsIcon />,
            path: "/admin-management",
          },
        ]
      : baseMenuItems;

  const handleSignout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      alert(error.message);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 265,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 265,
          boxSizing: "border-box",
          borderRight: "1px solid #D9DADF",
          padding: 2,
        },
      }}
    >
      <div className="mb-4">
        <Typography variant="h6" className="text-gray-800 font-medium">
          K.M.C Smart Tracking
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          Home of Computer Solutions
        </Typography>
        {userRole && (
          <div className="mt-5 text-sm">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
              {userRole === "superadmin" ? "Super Admin" : "Admin"}
            </span>
          </div>
        )}
      </div>

      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            className={`mt-3
              ${
                currentPath.startsWith(item.path)
                  ? "bg-[#3DC2960D] text-[#3DC296] border border-[#3DC2961A] rounded-lg"
                  : ""
              }`}
          >
            <ListItemIcon
              className={
                currentPath.startsWith(item.path)
                  ? "text-[#3DC296] -mr-4"
                  : "text-[#2C3E50] -mr-4"
              }
            >
              {typeof item.icon === "string" ? (
                <img
                  src={item.icon}
                  alt=""
                  style={{
                    filter: currentPath.startsWith(item.path)
                      ? "brightness(0) saturate(100%) invert(43%) sepia(72%) saturate(269%) hue-rotate(104deg) brightness(96%) contrast(91%)"
                      : "none",
                  }}
                />
              ) : (
                React.cloneElement(item.icon, {
                  sx: {
                    filter: currentPath.startsWith(item.path)
                      ? "brightness(0) saturate(100%) invert(43%) sepia(72%) saturate(269%) hue-rotate(104deg) brightness(96%) contrast(91%)"
                      : "none",
                  },
                })
              )}
            </ListItemIcon>

            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <CustomButton
        title={"Logout"}
        style={"bg-red-500 text-white mt-20"}
        onClick={handleSignout}
      />
    </Drawer>
  );
};

export default Sidebar;
