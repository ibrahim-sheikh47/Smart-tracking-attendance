import React, { useEffect, useState } from "react";
import DashboardCard from "../ui_components/DashboardCard.jsx";
import assets from "../constants/assets.jsx";
import { firestoreDb } from "../config/firebase.jsx";
import { getDocs, collection } from "firebase/firestore";
import DataTable from "../ui_components/Table.jsx";
import EmployeeTable from "../ui_components/Table.jsx";
import CustomButton from "../ui_components/CustomButton.jsx";

const Dashboard = () => {
  const [staffList, setStaffList] = useState([]);
  const staffRef = collection(firestoreDb, "employees");

  const [checkIns, setCheckIns] = useState([]);
  const checkInsRef = collection(firestoreDb, "CheckIns");

  const [absents, setAbsents] = useState([]);
  const absentRef = collection(firestoreDb, "Absents");

  console.log("Check Ins Ref Key = ", checkInsRef.id);
  useEffect(() => {
    getAllStaffMembers(staffList, setStaffList, staffRef);
  }, []);

  useEffect(() => {
    getAllCheckIns(checkIns, setCheckIns, checkInsRef);
  }, []);

  useEffect(() => {
    getAllAbsentees(absents, setAbsents, absentRef);
  }, []);

  return (
    <div>
    {/* <CustomButton title={"QR CODE"} onClick={()=>navigateTo("/dashboard/ImgTest")}/> */}
      <div className="flex flex-col p-10">
        <h2 className="text-black">Dashboard</h2>
        <h4 className="mt-2 text-gray-600">
          Overview of all staff activities.
        </h4>

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
            value={240}
            icon={assets.lateArrivals}
          />
        </div>

        <div className="mt-10">
        <EmployeeTable />
        </div>
      </div>
    </div>
  );
};

function getAllCheckIns(checkIns, setCheckIns, checkInsRef) {
  const getAllCheckIns = async () => {
    try {
      const data = await getDocs(checkInsRef);
      const filteredCheckIns = data.docs.map((checkInDoc) => ({
        ...checkInDoc.data(), // A Snapshot basically
        employeeId: checkInDoc.id,
      }));
      setCheckIns(filteredCheckIns);
      console.log(filteredCheckIns);
    } catch (e) {
      console.error(e);
    }
  };
  getAllCheckIns();
}
function getAllAbsentees(absents, setAbsents, absentRef) {
    const getAllAbsentees = async () => {
      try {
        const data = await getDocs(absentRef);
        const filteredAbsents = data.docs.map((checkInDoc) => ({
          ...checkInDoc.data(), // A Snapshot basically
          employeeId: checkInDoc.id,
        }));
        setAbsents(filteredAbsents);
        console.log(filteredAbsents);
      } catch (e) {
        console.error(e);
      }
    };
    getAllAbsentees();
  }

function getAllStaffMembers(staffList, setStaffList, staffRef) {
  const getAllStaff = async () => {
    try {
      const data = await getDocs(staffRef);
      const filteredStaff = data.docs.map((staffDoc) => ({
        ...staffDoc.data(), // A Snapshot basically
        staffId: staffDoc.id,
      }));
      setStaffList(filteredStaff);
      console.log(filteredStaff);
    } catch (e) {
      console.error(e);
    }
  };
  getAllStaff();
}

export default Dashboard;
