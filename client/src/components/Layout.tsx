import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

const ROLE_LABEL = { frontdesk: "Front desk", cashier: "Cashier", admin: "Admin" };

export default function Layout() {
  const { user, logout, can } = useAuth();
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? "bg-brand-light text-brand" : "text-slate-600 hover:bg-slate-100"}`;

  return (
