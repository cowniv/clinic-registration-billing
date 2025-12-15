import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

const ROLE_LABEL = { frontdesk: "Front desk", cashier: "Cashier", admin: "Admin" };

export default function Layout() {
  const { user, logout, can } = useAuth();
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? "bg-brand-light text-brand" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-4 font-bold text-brand">Clinic Front Desk</span>
          <NavLink to="/" end className={link}>
            Today
          </NavLink>
          <NavLink to="/patients" className={link}>
            Patients
          </NavLink>
