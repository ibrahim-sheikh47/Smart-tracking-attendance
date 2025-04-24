import React, {useEffect, useState} from 'react'
import DashboardCard from "../ui_components/DashboardCard.jsx";
import assets from "../constants/assets.jsx";
import {firestoreDb} from "../config/firebase.jsx";
import {getDocs, collection} from "firebase/firestore";

const Dashboard = () => {

    const [staffList, setStaffList] = useState([]);
    const staffRef = collection(firestoreDb, "Staff");

    useEffect(() => {
        const getAllStaff = async () => {
            try {
                const data = await getDocs(staffRef);
                const filteredStaff = data.docs.map((staffDoc) => ({
                    ...staffDoc.data(), // A Snapshot basically
                    staffId: staffDoc.id,
                }));
                setStaffList(filteredStaff);
                console.log(filteredStaff);
            }
            catch (e) {
                console.error(e);
            }
        };
        getAllStaff();
    }, []);

    return (
        <div>
            <div className="flex flex-col p-10">
                <h2 className="text-black">Dashboard</h2>
                <h4 className="mt-2 text-gray-600">Overview of all staff activities.</h4>

                <div className="flex mt-10 gap-5 justify-center content-center">
                    <DashboardCard title={"Total Staff"} value={staffList.length} icon={assets.totalStaff}/>
                    <DashboardCard title={"Check-ins Today"} value={240} icon={assets.checkInsToday}/>
                    <DashboardCard title={"Absentees"} value={240} icon={assets.totalAbsents}/>
                    <DashboardCard title={"Late Arrivals"} value={240} icon={assets.lateArrivals}/>

                </div>

            </div>
        </div>
    )
}
export default Dashboard
