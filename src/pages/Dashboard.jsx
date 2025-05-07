// import React, { useEffect, useState } from "react";
// import DashboardCard from "../ui_components/DashboardCard.jsx";
// import assets from "../constants/assets.jsx";
// import { firestoreDb } from "../config/firebase.jsx";
// import { getDocs, collection } from "firebase/firestore";
// import EmployeeTable from "../ui_components/Table.jsx";
// import CustomButton from "../ui_components/CustomButton.jsx";
// import QRCodeGenerator from "./QrCodeGeneratior.jsx";

// const Dashboard = () => {
//   const [staffList, setStaffList] = useState([]);
//   const staffRef = collection(firestoreDb, "employees");

//   const [checkIns, setCheckIns] = useState([]);
//   const checkInsRef = collection(firestoreDb, "CheckIns");

//   const [absents, setAbsents] = useState([]);
//   const absentRef = collection(firestoreDb, "Absents");

//   useEffect(() => {
//     getAllStaffMembers(staffList, setStaffList, staffRef);
//   }, []);

//   useEffect(() => {
//     getAllCheckIns(checkIns, setCheckIns, checkInsRef);
//   }, []);

//   useEffect(() => {
//     getAllAbsentees(absents, setAbsents, absentRef);
//   }, []);

//   return (
//     <div>
//       <div className="flex flex-col p-10">
//         <div className="flex justify-between items-center">
//           <div>
//             <h2 className="text-black">Dashboard</h2>
//             <h4 className="mt-2 text-gray-600">
//               Overview of all staff activities.
//             </h4>
//           </div>
//           <QRCodeGenerator />
//         </div>

//         <div className="flex mt-10 justify-between">
//           <DashboardCard
//             title={"Total Staff"}
//             value={staffList.length}
//             icon={assets.totalStaff}
//           />
//           <DashboardCard
//             title={"Check-ins Today"}
//             value={checkIns.length}
//             icon={assets.checkInsToday}
//           />
//           <DashboardCard
//             title={"Absentees"}
//             value={absents.length}
//             icon={assets.totalAbsents}
//           />
//           <DashboardCard
//             title={"Late Arrivals"}
//             value={240}
//             icon={assets.lateArrivals}
//           />
//         </div>

//         <div className="mt-10">
//           <EmployeeTable />
//         </div>
//       </div>
//     </div>
//   );
// };

// function getAllCheckIns(checkIns, setCheckIns, checkInsRef) {
//   const getAllCheckIns = async () => {
//     try {
//       const data = await getDocs(checkInsRef);
//       const filteredCheckIns = data.docs.map((checkInDoc) => ({
//         ...checkInDoc.data(),
//         employeeId: checkInDoc.id,
//       }));
//       setCheckIns(filteredCheckIns);
//     } catch (e) {
//       console.error(e);
//     }
//   };
//   getAllCheckIns();
// }

// function getAllAbsentees(absents, setAbsents, absentRef) {
//   const getAllAbsentees = async () => {
//     try {
//       const data = await getDocs(absentRef);
//       const filteredAbsents = data.docs.map((checkInDoc) => ({
//         ...checkInDoc.data(),
//         employeeId: checkInDoc.id,
//       }));
//       setAbsents(filteredAbsents);
//     } catch (e) {
//       console.error(e);
//     }
//   };
//   getAllAbsentees();
// }

// function getAllStaffMembers(staffList, setStaffList, staffRef) {
//   const getAllStaff = async () => {
//     try {
//       const data = await getDocs(staffRef);
//       const filteredStaff = data.docs.map((staffDoc) => ({
//         ...staffDoc.data(),
//         staffId: staffDoc.id,
//       }));
//       setStaffList(filteredStaff);
//     } catch (e) {
//       console.error(e);
//     }
//   };
//   getAllStaff();
// }

// export default Dashboard;

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
} from "firebase/firestore";
import EmployeeTable from "../ui_components/Table.jsx";
import QRCodeGenerator from "../pages/QrCodeGeneratior.jsx";

const Dashboard = () => {
  const [staffList, setStaffList] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [absents, setAbsents] = useState([]);
  const [lateArrivals, setLateArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          getAllStaffMembers(),
          getTodayCheckIns(),
          calculateAbsentees(),
          getLateArrivals(),
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // Set up a refresh interval (every 5 minutes)
    const refreshInterval = setInterval(fetchAllData, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  const getAllStaffMembers = async () => {
    try {
      const staffRef = collection(firestoreDb, "employees");
      const data = await getDocs(staffRef);
      const filteredStaff = data.docs.map((staffDoc) => ({
        ...staffDoc.data(),
        staffId: staffDoc.id,
      }));
      setStaffList(filteredStaff);
      return filteredStaff;
    } catch (e) {
      console.error("Error getting staff members:", e);
      return [];
    }
  };

  const getTodayCheckIns = async () => {
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTimestamp = Timestamp.fromDate(today);

      // Create query for today's check-ins
      const checkInsRef = collection(firestoreDb, "CheckIns");
      const q = query(checkInsRef, where("checkInTime", ">=", todayTimestamp));

      const data = await getDocs(q);
      const filteredCheckIns = data.docs.map((checkInDoc) => ({
        ...checkInDoc.data(),
        id: checkInDoc.id,
      }));

      setCheckIns(filteredCheckIns);
      return filteredCheckIns;
    } catch (e) {
      console.error("Error getting check-ins:", e);
      return [];
    }
  };

  const calculateAbsentees = async () => {
    try {
      // Get all staff and today's check-ins
      const allStaff = await getAllStaffMembers();
      const todayAttendance = await getTodayCheckIns();

      // Get IDs of staff who checked in today
      const checkedInIds = todayAttendance.map((record) => record.employeeId);

      // Filter staff who haven't checked in
      const absentStaff = allStaff.filter(
        (staff) => !checkedInIds.includes(staff.uid)
      );

      setAbsents(absentStaff);
      return absentStaff;
    } catch (e) {
      console.error("Error calculating absentees:", e);
      return [];
    }
  };

  const getLateArrivals = async () => {
    try {
      // Get today's check-ins
      const todayAttendance = await getTodayCheckIns();

      // Filter for late arrivals (assuming 9 AM is the cutoff)
      const lateStaff = todayAttendance.filter((record) => {
        if (!record.checkInTime) return false;

        const checkInTime = record.checkInTime.toDate();
        const cutoffTime = new Date(checkInTime);
        cutoffTime.setHours(20, 0, 0, 0); // 9:00 AM cutoff

        return checkInTime > cutoffTime;
      });

      setLateArrivals(lateStaff);
      return lateStaff;
    } catch (e) {
      console.error("Error getting late arrivals:", e);
      return [];
    }
  };

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
            value={checkIns.length}
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
            absents={absents}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
