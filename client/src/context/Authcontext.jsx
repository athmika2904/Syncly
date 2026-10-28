import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import api, { setUnauthorizedHandler } from "../services/api";

const Authcontext = createContext(null);

const STORAGE_KEY = "syncly_auth";


const MAX_TIMEOUT_MS = 2 ** 31 - 1;


const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

// Reads the saved session. Has no side effects, so it is safe to run
// twice (React StrictMode does that in development).
const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return { user: null, token: null, expired: false };

    const saved = JSON.parse(raw);

    if (!saved?.token || !saved?.user) {
      return { user: null, token: null, expired: false };
    }

    const expiry = getTokenExpiry(saved.token);

    if (expiry === null || expiry <= Date.now()) {
      return { user: null, token: null, expired: true };
    }

    return { user: saved.user, token: saved.token, expired: false };
  } catch {
    return { user: null, token: null, expired: false };
  }
};

const clearStoredAuth = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    
  }
};

export const AuthProvider = ({ children }) => {
  const [initial] = useState(loadStoredAuth);

  const [auth, setAuth] = useState({
    user: initial.user,
    token: initial.token
  });

  
  const [sessionExpired, setSessionExpired] = useState(initial.expired);

  const tokenRef = useRef(initial.token);

  
  useEffect(() => {
    if (initial.expired) clearStoredAuth();
  }, [initial.expired]);

  const saveAuth = (data) => {
    const next = { user: data.user, token: data.token };

    tokenRef.current = next.token;
    setAuth(next);
    setSessionExpired(false);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode, etc.). Session lasts until refresh.
    }
  };

  const signup = async (name, email, password) => {
    const response = await api.post("/auth/signup", {
      name,
      email,
      password
    });

    saveAuth(response.data);
    return response.data;
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password
    });

    saveAuth(response.data);
    return response.data;
  };

  const logout = useCallback(() => {
    tokenRef.current = null;
    setAuth({ user: null, token: null });
    setSessionExpired(false);
    clearStoredAuth();
  }, []);

  
  const expireSession = useCallback(() => {
    
    if (!tokenRef.current) return;

    tokenRef.current = null;
    setAuth({ user: null, token: null });
    setSessionExpired(true);
    clearStoredAuth();
  }, []);

  
  useEffect(() => {
    setUnauthorizedHandler(expireSession);

    return () => setUnauthorizedHandler(null);
  }, [expireSession]);

  
  useEffect(() => {
    if (!auth.token) return;

    const expiry = getTokenExpiry(auth.token);

    if (expiry === null) return;

    const remaining = expiry - Date.now();

    if (remaining <= 0) {
      expireSession();
      return;
    }

    const timer = setTimeout(
      expireSession,
      Math.min(remaining, MAX_TIMEOUT_MS)
    );

    return () => clearTimeout(timer);
  }, [auth.token, expireSession]);

  return (
    <Authcontext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        signup,
        login,
        logout,
        sessionExpired,
        isAuthenticated: Boolean(auth.user && auth.token)
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
