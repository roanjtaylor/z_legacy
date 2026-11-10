import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchUserData } from "../services/firebaseService"; // Import service

const UserContext = createContext();

// Provide user data across all the screens
export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // Holds user data
  const [loading, setLoading] = useState(true); // Tracks loading state

  // Fetch user data on initial load
  useEffect(() => {
    async function loadUserData() {
      try {
        const data = await fetchUserData();
        setUser(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  // Function to reload user data
  const reloadUser = async () => {
    setLoading(true);
    try {
      const data = await fetchUserData();
      setUser(data);
    } catch (error) {
      console.error("Error reloading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, reloadUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
