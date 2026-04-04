import { useState, useCallback } from "react";

export interface AuthUser {
  id: number;
  username: string;
  role: "admin" | "manager" | "worker";
  createdAt: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("teamflow_token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("teamflow_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem("teamflow_token", newToken);
    localStorage.setItem("teamflow_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("teamflow_token");
    localStorage.removeItem("teamflow_user");
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, login, logout, isAuthenticated: !!token };
}
