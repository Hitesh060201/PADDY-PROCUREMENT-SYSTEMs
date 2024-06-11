import React, { useState, createContext } from "react";

export const TrackingContext = createContext(null);

export const TrackingProvider = ({ children }) => {
    //STATE VARIABLE
    const DappName = "Product Tracking Dapp";
    const [currentUser, setCurrentUser] = useState("");
    const [name,setName]=useState("Login");
    const [user,setUser]=useState(null);

    return (
        <TrackingContext.Provider
            value={{
                currentUser,
                name,
                setName,
                user,
                setUser,
                setCurrentUser,
                DappName
            }}
        >
        {children}
        </TrackingContext.Provider>
    );
}