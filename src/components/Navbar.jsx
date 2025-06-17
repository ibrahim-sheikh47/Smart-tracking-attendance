import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, IconButton, Avatar } from "@mui/material";
import {
  Notifications as NotificationsIcon,
  ChevronRight,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const Navbar = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentPage =
    pathSegments.length > 0
      ? pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1)
      : "Home";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        setUser(currentUser);

        try {
          // Check if user is super admin from "admins" collection
          const adminRef = doc(db, "admins", currentUser.uid);
          const adminSnap = await getDoc(adminRef);

          console.log("Admin document exists:", adminSnap.exists());
          if (adminSnap.exists()) {
            console.log("Admin data:", adminSnap.data());
            const adminData = adminSnap.data();
            setIsSuperAdmin(adminData.isSuper === true);
          } else {
            console.log("No admin document found for user:", currentUser.uid);
            setIsSuperAdmin(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsSuperAdmin(false);
        }
      } else {
        setUser(null);
        setIsSuperAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Function to get display name
  const getDisplayName = () => {
    if (loading) return "Loading...";
    if (isSuperAdmin) return "Super Admin";
    return user?.displayName || user?.email || "User";
  };

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      className="border-b border-gray-200 bg-white"
    >
      <Toolbar className="h-[72px]">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-black">
          <h1>Home</h1>
          <span className="mx-2">
            <ChevronRight />
          </span>
          <h1>{currentPage}</h1>
        </div>

        <div className="flex-grow" />

        {/* Notifications */}
        <IconButton>
          <NotificationsIcon />
        </IconButton>

        {/* User Info */}
        <div className="flex items-center ml-4">
          <Avatar
            className="mr-2"
            src={user?.photoURL || ""}
            alt={getDisplayName()}
          />
          <Typography variant="body1" className="mr-1">
            {getDisplayName()}
          </Typography>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
