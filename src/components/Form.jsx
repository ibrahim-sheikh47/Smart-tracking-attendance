import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { firestoreDb } from "../config/firebase";

const AddEmployeeForm = ({ onAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    checkIn: "",
    checkOut: "",
    totalHours: "",
    status: "Present",
    image: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(firestoreDb, "Employees"), formData);
      alert("Employee added!");
      setFormData({
        name: "",
        date: "",
        checkIn: "",
        checkOut: "",
        totalHours: "",
        status: "Present",
        image: "",
      });
      onAdded?.(); // optional callback to refresh table
    } catch (err) {
      console.error("Error adding document: ", err);
      alert("Error adding employee.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded mb-4">
      <h2 className="font-bold mb-2">Add Employee</h2>
      <div className="grid grid-cols-2 gap-4">
        <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
        <input name="date" type="date" value={formData.date} onChange={handleChange} required />
        <input name="checkIn" placeholder="Check-In (e.g., 09:00 AM)" value={formData.checkIn} onChange={handleChange} />
        <input name="checkOut" placeholder="Check-Out (e.g., 06:00 PM)" value={formData.checkOut} onChange={handleChange} />
        <input name="totalHours" placeholder="Total Hours (e.g., 8 Hrs)" value={formData.totalHours} onChange={handleChange} />
        <input name="status" placeholder="Status (e.g., Present)" value={formData.status} onChange={handleChange} />
        <input name="image" placeholder="Image URL" value={formData.image} onChange={handleChange} />
      </div>
      <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
    </form>
  );
};

export default AddEmployeeForm;
