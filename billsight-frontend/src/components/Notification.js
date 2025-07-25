import React, { createContext, useState, useContext, useCallback } from "react";

export const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [msg, setMsg] = useState(null);
  const [visible, setVisible] = useState(false);

  const showNotification = useCallback((text, timeout = 3000) => {
    setMsg(text);
    setVisible(true);
    setTimeout(() => setVisible(false), timeout);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {visible && (
        <div style={{
          position: "fixed",
          bottom: 30,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#333",
          color: "#fff",
          padding: "13px 32px",
          borderRadius: 8,
          boxShadow: "0 5px 40px rgba(0,0,0,0.1)",
          zIndex: 2000,
          fontSize: 15,
          fontWeight: 500
        }}>
          {msg}
        </div>
      )}
    </NotificationContext.Provider>
  );
};