import { createContext, useContext, useState, type ReactNode } from "react";
import { api, tokenStore, type Role, type User } from "./api";

type AuthState = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  can: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);
const USER_KEY = "clinic.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved && tokenStore.get() ? (JSON.parse(saved) as User) : null;
  });

  async function login(username: string, password: string) {
    const res = await api<{ token: string; user: User }>("/auth/login", { body: { username, password } });
    tokenStore.set(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
  }

  function logout() {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  // admin can do everything, same rule as the server
  const can = (...roles: Role[]) => !!user && (user.role === "admin" || roles.includes(user.role));

  return <AuthContext.Provider value={{ user, login, logout, can }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
