import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to Socket.IO server using environment variable
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";
    console.log("Connecting to Socket.IO server at:", backendUrl);
    
    const newSocket = io(backendUrl, {
      withCredentials: true,
      transports: ["polling", "websocket"], // Try polling first, then upgrade to websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      upgrade: true,
      rememberUpgrade: true,
      secure: false, // Set to true if using HTTPS
      rejectUnauthorized: false,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      console.log("Transport:", newSocket.io.engine.transport.name);
      setIsConnected(true);
      // Join with user ID
      if (user?.id) {
        console.log("Emitting user:join with userId:", user.id, "role:", user.role);
        newSocket.emit("user:join", user.id);
      }
    });

    // Add listener for users:online event to debug
    newSocket.on("users:online", (data) => {
      console.log("SocketContext received users:online event:", data);
    });

    // Add listener for user:status to debug
    newSocket.on("user:status", (data) => {
      console.log("SocketContext received user:status event:", data);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected. Reason:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      console.error("Error details:", error);
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    newSocket.io.on("reconnect_attempt", () => {
      console.log("Attempting to reconnect...");
    });

    newSocket.io.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
