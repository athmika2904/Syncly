import { createContext, useContext, useState } from "react";
import api from "../services/api";

const Authcontext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token,setToken]=useState(null);
  const signup = async (name, email, password) => {
    const response = await api.post("/auth/signup", {
      name,
      email,
      password
    });

    setUser(response.data.user);
    setToken(response.data.token);
    return response.data;
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password
    });

    setUser(response.data.user);
    setToken(response.data.token);
    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <Authcontext.Provider
      value={{
        user,
        token,
        signup,
        login,
        logout,
        isAuthenticated: Boolean(user)
      }}
    >
      {children}
    </Authcontext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(Authcontext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};