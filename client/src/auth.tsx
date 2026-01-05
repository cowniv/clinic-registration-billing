import { createContext, useContext, useState, type ReactNode } from "react";
import { api, tokenStore, type Role, type User } from "./api";

type AuthState = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  can: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);
