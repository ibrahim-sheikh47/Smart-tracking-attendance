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
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AttachMoney as PayrollIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import assets from "../constants/assets";

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { text: "Dashboard", icon: assets.sidebarIcon1, path: "/dashboard" },
    { text: "Manage Staff", icon: assets.sidebarIcon2, path: "/manage-staff" },
    { text: "Payroll", icon: assets.sidebarIcon3, path: "/payroll" },
    { text: "Reports", icon: assets.sidebarIcon4, path: "/reports" },
    { text: "Settings", icon:assets.sidebarIcon5, path: "/settings" },
  ];

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
      <div className="border-b border-gray-200">
        <Typography variant="h6" className="text-gray-800 font-medium">
          K.M.C Smart Tracking
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          Home of Computer Solutions
        </Typography>
      </div>

      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            className={`mt-5
              ${
                currentPath === item.path
                  ? "bg-[#098B710D] text-[#098B71] border border-[#098B711A] rounded-lg"
                  : ""
              }`}
          >
            <ListItemIcon
              className={
                currentPath === item.path
                  ? "text-[#098B71] -mr-4"
                  : "text-[#2C3E50] -mr-4"
              }
            >
              <img
                src={item.icon}
                alt=""
                style={{
                  filter:
                    currentPath === item.path
                      ? "brightness(0) saturate(100%) invert(43%) sepia(72%) saturate(269%) hue-rotate(104deg) brightness(96%) contrast(91%)"
                      : "none",
                }}
              />
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
