import React, { createContext, useState, useEffect } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);

  // On login, fetch user info, set both token and user
  const login = async (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    api.defaults.headers["Authorization"] = `Bearer ${newToken}`;
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch {
      setUser(null); // invalid token
    }
  };

  // On logout, clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    delete api.defaults.headers["Authorization"];
  };

  // On mount, fetch user if token present
  useEffect(() => {
    if (token) {
      api.defaults.headers["Authorization"] = `Bearer ${token}`;
      api.get("/users/me")
        .then(res => setUser(res.data))
        .catch(() => logout());
    }
   
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};