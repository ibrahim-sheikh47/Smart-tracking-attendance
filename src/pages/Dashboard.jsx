/* eslint-disable no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import DashboardCard from "../ui_components/DashboardCard.jsx";
import assets from "../constants/assets.jsx";
import { firestoreDb } from "../config/firebase.jsx";
import {
  getDocs,
  collection,
  query,
  where,
  Timestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import EmployeeTable from "../ui_components/Table.jsx";
import QRCodeGenerator from "../pages/QrCodeGeneratior.jsx";
import { getAuth } from "firebase/auth";

const Dashboard = () => {
  const [staffList, setStaffList] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [checkOuts, setCheckOuts] = useState([]);
  const [todayCheckIns, setTodayCheckIns] = useState([]);
  const [absents, setAbsents] = useState([]);
  const [lateArrivals, setLateArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    // Get the current admin user
    const fetchCurrentAdmin = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          // Get the admin document
          const adminDoc = await getDoc(doc(firestoreDb, "admins", user.uid));
          if (adminDoc.exists()) {
            setCurrentAdmin({ id: adminDoc.id, ...adminDoc.data() });
          } else {
            console.error("Admin document not found");
          }
        } catch (error) {
          console.error("Error fetching admin data:", error);
        }
      }
    };

    fetchCurrentAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin) {
      const fetchAllData = async () => {
        try {
          setLoading(true);

          // First get all staff members
          const staff = await getAllStaffMembers();

          // Then get all check-ins and check-outs for the table
          const allCheckIns = await getAllCheckIns();
          const allCheckOuts = await getAllCheckOuts();

          // Then get today's check-ins for dashboard stats
          const todayCheckins = await getTodayCheckIns();

          // Calculate absents and late arrivals based on today's data
          await calculateAbsentees(staff, todayCheckins);
          await calculateLateArrivals(todayCheckins);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAllData();

      // Set up a refresh interval (every 5 minutes)
      const refreshInterval = setInterval(() => {
        fetchAllData();
      }, 5 * 60 * 1000);

      return () => clearInterval(refreshInterval);
    }
  }, [currentAdmin]);

  // Get all check-ins for the table
  const getAllCheckIns = async () => {
    try {
      if (!currentAdmin) return [];

      // Create query for all check-ins
      const checkInsRef = collection(firestoreDb, "CheckIns");

      // Get employee IDs for this admin
      const employeeIds = staffList.map(staff => staff.uid);

      // Get all check-ins for employees of this admin
      const data = await getDocs(checkInsRef);
      const allCheckIns = data.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
          employeeId: doc.data().employeeId || doc.id,
        }))
        .filter(checkIn => employeeIds.includes(checkIn.employeeId));

      console.log(`Fetched ${allCheckIns.length} total check-ins`);

      // Log the structure of the first check-in to help debug
      if (allCheckIns.length > 0) {
        console.log(
          "Sample check-in structure:",
          JSON.stringify(
            allCheckIns[0],
            (key, value) => {
              // Handle Firestore Timestamp objects for logging
              if (
                value &&
                typeof value === "object" &&
                value.seconds !== undefined &&
                value.nanoseconds !== undefined
              ) {
                return `Timestamp(${new Date(
                  value.seconds * 1000
                ).toISOString()})`;
              }
              return value;
            },
            2
          )
        );
      }

      setCheckIns(allCheckIns);
      return allCheckIns;
    } catch (e) {
      console.error("Error getting check-ins:", e);
      return [];
    }
  };

  // Get today's check-ins for dashboard stats
  const getTodayCheckIns = async () => {
    try {
      if (!currentAdmin) return [];

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      // Create query for today's check-ins
      const checkInsRef = collection(firestoreDb, "CheckIns");
      const q = query(checkInsRef, where("checkInTime", ">=", todayTimestamp));

      // Get employee IDs for this admin
      const employeeIds = staffList.map(staff => staff.uid);

      // Get today's check-ins
      const data = await getDocs(q);
      const todayCheckIns = data.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
          employeeId: doc.data().employeeId || doc.id,
        }))
        .filter(checkIn => employeeIds.includes(checkIn.employeeId));

      console.log(`Fetched ${todayCheckIns.length} check-ins for today`);

      // Log each check-in for today to debug
      todayCheckIns.forEach((checkIn) => {
        const checkInTime = checkIn.checkInTime?.toDate
          ? checkIn.checkInTime.toDate().toLocaleTimeString()
          : "unknown time";
        console.log(
          `Today's check-in: Employee ${checkIn.employeeId} at ${checkInTime}`
        );
      });

      setTodayCheckIns(todayCheckIns);
      return todayCheckIns;
    } catch (e) {
      console.error("Error getting today's check-ins:", e);
      return [];
    }
  };

  // Get all check-outs for the table
  const getAllCheckOuts = async () => {
    try {
      if (!currentAdmin) return [];

      // Create query for all check-outs
      const checkOutsRef = collection(firestoreDb, "CheckOuts");

      // Get employee IDs for this admin
      const employeeIds = staffList.map(staff => staff.uid);

      // Get all check-outs
      const data = await getDocs(checkOutsRef);
      const allCheckOuts = data.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
          employeeId: doc.data().employeeId || doc.id,
        }))
        .filter(checkOut => employeeIds.includes(checkOut.employeeId));

      console.log(`Fetched ${allCheckOuts.length} total check-outs`);

      // Log the structure of the first check-out to help debug
      if (allCheckOuts.length > 0) {
        console.log(
          "Sample check-out structure:",
          JSON.stringify(
            allCheckOuts[0],
            (key, value) => {
              // Handle Firestore Timestamp objects for logging
              if (
                value &&
                typeof value === "object" &&
                value.seconds !== undefined &&
                value.nanoseconds !== undefined
              ) {
                return `Timestamp(${new Date(
                  value.seconds * 1000
                ).toISOString()})`;
              }
              return value;
            },
            2
          )
        );
      }

      setCheckOuts(allCheckOuts);
      return allCheckOuts;
    } catch (e) {
      console.error("Error getting check-outs:", e);
      return [];
    }
  };

  const getAllStaffMembers = async () => {
    try {
      if (!currentAdmin) return [];

      // Get employees from the admin's subcollection
      const staffRef = collection(firestoreDb, "admins", currentAdmin.uid, "employees");
      const data = await getDocs(staffRef);

      const filteredStaff = data.docs.map((staffDoc) => {
        const docData = staffDoc.data();
        return {
          ...docData,
          staffId: staffDoc.id,
          uid: docData.uid || staffDoc.id, // Ensure uid exists, fallback to doc.id
          adminId: currentAdmin.uid, // Add the admin ID to each employee
        };
      });

      console.log(`Fetched ${filteredStaff.length} staff members for admin ${currentAdmin.uid}`);

      // Log each staff member to debug
      filteredStaff.forEach((staff) => {
        console.log(
          `Staff member: ${staff.firstName} ${staff.lastName}, ID: ${staff.uid}, Admin: ${staff.adminId}`
        );
      });

      setStaffList(filteredStaff);
      return filteredStaff;
    } catch (e) {
      console.error("Error getting staff members:", e);
      return [];
    }
  };

  const calculateAbsentees = async (staff, todayCheckins) => {
    try {
      // Use the passed staff and today's check-ins or fetch them if not provided
      const allStaff = staff || (await getAllStaffMembers());
      const todayAttendance = todayCheckins || (await getTodayCheckIns());

      // Get IDs of staff who checked in today
      const checkedInIds = todayAttendance.map((record) => record.employeeId);
      console.log("Staff who checked in today:", checkedInIds);

      // Filter staff who haven't checked in today
      const absentStaff = allStaff.filter(
        (staff) => !checkedInIds.includes(staff.uid)
      );

      // Log each absent staff member to debug
      absentStaff.forEach((staff) => {
        console.log(
          `Absent staff: ${staff.firstName} ${staff.lastName}, ID: ${staff.uid}`
        );
      });

      console.log(`Found ${absentStaff.length} absent staff members`);
      setAbsents(absentStaff);
      return absentStaff;
    } catch (e) {
      console.error("Error calculating absentees:", e);
      return [];
    }
  };

  const calculateLateArrivals = async (todayCheckins) => {
    try {
      // Use the passed today's check-ins or fetch them if not provided
      const todayAttendance = todayCheckins || (await getTodayCheckIns());

      // Filter for late arrivals (after 9:00 AM is the cutoff)
      const lateStaff = todayAttendance.filter((record) => {
        if (!record.checkInTime) return false;

        try {
          // Get the check-in time
          const checkInTime =
            typeof record.checkInTime.toDate === "function"
              ? record.checkInTime.toDate()
              : new Date(record.checkInTime);

          // Create cutoff times for the same day
          const checkInDate = new Date(checkInTime);

          // Standard cutoff time - 9:00 AM
          // IMPORTANT: Adding 1 second buffer to allow for exact 9:00:00 check-ins
          const cutoffTime = new Date(
            checkInDate.getFullYear(),
            checkInDate.getMonth(),
            checkInDate.getDate(),
            9, 0, 1, 0  // 9:00:01 AM cutoff (1 second after 9:00 AM)
          );

          // Early morning cutoff (before 5:00 AM is considered late)
          const earlyMorningCutoff = new Date(
            checkInDate.getFullYear(),
            checkInDate.getMonth(),
            checkInDate.getDate(),
            5, 0, 0, 0  // 5:00 AM cutoff for early morning
          );

          // Consider late if:
          // 1. Check-in is after 9:00:01 AM (allowing exactly 9:00:00 AM to be on time), or
          // 2. Check-in is before 5:00 AM (very early morning is considered late)
          const isLate = checkInTime > cutoffTime || checkInTime < earlyMorningCutoff;

          // Log for debugging
          console.log(
            `Employee ${record.employeeId} check-in: ${checkInTime.toLocaleTimeString()}, ` +
            `cutoff: ${cutoffTime.toLocaleTimeString()}, isLate: ${isLate}`
          );

          return isLate;
        } catch (error) {
          console.error("Error processing late arrival:", error);
          return false;
        }
      });

      console.log(`Found ${lateStaff.length} late arrivals today`);
      setLateArrivals(lateStaff);
      return lateStaff;
    } catch (e) {
      console.error("Error calculating late arrivals:", e);
      return [];
    }
  };

  console.log("Dashboard stats:", {
    totalStaff: staffList.length,
    todayCheckIns: todayCheckIns.length,
    absents: absents.length,
    lateArrivals: lateArrivals.length,
  });

  return (
    <div>
      <div className="flex flex-col p-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-black">Dashboard</h2>
            <h4 className="mt-2 text-gray-600">
              Overview of all staff activities.
            </h4>
          </div>
          <QRCodeGenerator />
        </div>

        <div className="flex mt-10 justify-between">
          <DashboardCard
            title={"Total Staff"}
            value={staffList.length}
            icon={assets.totalStaff}
          />
          <DashboardCard
            title={"Check-ins Today"}
            value={todayCheckIns.length}
            icon={assets.checkInsToday}
          />
          <DashboardCard
            title={"Absentees"}
            value={absents.length}
            icon={assets.totalAbsents}
          />
          <DashboardCard
            title={"Late Arrivals"}
            value={lateArrivals.length}
            icon={assets.lateArrivals}
          />
        </div>

        <div className="mt-10">
          <EmployeeTable
            staffList={staffList}
            checkIns={checkIns}
            checkOuts={checkOuts}
            absents={absents}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
