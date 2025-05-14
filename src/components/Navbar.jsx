// components/Navbar.jsx
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  InputBase,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  ChevronRight,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentPage =
    pathSegments.length > 0
      ? pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1)
      : "Home";

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      className="border-b border-gray-200 bg-white"
    >
      <Toolbar className="h-[72px]">
        <div className="flex items-center text-black">
          <h1>
            Home
          </h1>
          <span className="mx-2"><ChevronRight/></span>
          <h1>
             {currentPage}
          </h1>
        </div>

        <div className="flex-grow" />

        <IconButton>
          <NotificationsIcon />
        </IconButton>

        <div className="flex items-center ml-4">
          <Avatar className="mr-2" />
          <Typography variant="body1" className="mr-1">
            Jerry Williams
          </Typography>
          <ArrowDownIcon />

        </div>

      </Toolbar>

    </AppBar>
  );
};

export default Navbar;
