
import {signOut, signInWithEmailAndPassword} from "firebase/auth";
import {useState} from "react";
import {auth} from "../config/firebase.jsx";

export const Auth = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    console.log(auth?.currentUser?.email);

    const signInEmailPass = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        }catch (error) {console.error(error);}
    }

    const logOut = async () => {
        try {
            await signOut(auth);
        }catch (error) {
            console.error(error);
        }
    }

    return (
        <div style={{ display: "flex", justifyContent: "center" , gap: "1rem", marginTop: "5rem", flexDirection: "column" }}>
            <input type="text"
                   placeholder="Email"
                   onChange={(e) => setEmail(e.target.value)}/>
            <input type="password"
                   placeholder="Password"
                   onChange={(e) => setPassword(e.target.value)}/>

            <button onClick={signInEmailPass}>Sign In</button>

            <button className="bg-red-400"
                    onClick={logOut}>Logout</button>
        </div>
    )
}