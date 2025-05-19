// components/Navbar.jsx
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  ChevronRight,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";

const Navbar = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentPage =
      pathSegments.length > 0
          ? pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1)
          : "Home";

  // Listen for auth state changes to get fresh user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Force refresh user data when component mounts
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        await auth.currentUser?.reload();
        setUser(auth.currentUser);
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    };

    if (auth.currentUser) {
      refreshUserData();
    }
  }, []);

  return (
      <AppBar
          position="static"
          color="default"
          elevation={0}
          className="border-b border-gray-200 bg-white"
      >
        <Toolbar className="h-[72px]">
          <div className="flex items-center text-black">
            <h1>Home</h1>
            <span className="mx-2">
            <ChevronRight />
          </span>
            <h1>{currentPage}</h1>
          </div>

          <div className="flex-grow" />

          <IconButton>
            <NotificationsIcon />
          </IconButton>

          <div className="flex items-center ml-4">
            <Avatar className="mr-2" />
            <Typography variant="body1" className="mr-1">
              {user?.displayName || "Loading..."}
            </Typography>
          </div>
        </Toolbar>
      </AppBar>
  );
};

export default Navbar;