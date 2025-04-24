import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth } from "../config/firebase.jsx";
import { useNavigate } from "react-router-dom";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signInEmailPass = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
      alert("Logged In!")
    } catch (error) {
      console.error(error);
      alert(error)
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "1rem",
        marginTop: "5rem",
        flexDirection: "column",
      }}
      className="max-w-6xl mx-auto"
    >
      <input
        type="text"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />
      <button onClick={signInEmailPass} className="bg-blue-500 p-2 rounded">Sign In</button>

    </div>
  );
};