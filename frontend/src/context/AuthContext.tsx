import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getMe } from "../api/auth";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, setToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
