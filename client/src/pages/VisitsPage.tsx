import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { manilaTime, todayManila } from "../format";

type Row = { id: number; status: string; reason: string | null; created_at: string; first_name: string; last_name: string };

export const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  void: "bg-slate-200 text-slate-600",
};

export default function VisitsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    api<Row[]>(`/visits?date=${todayManila()}`).then(setRows);
  }, []);

  return (
    <div className="space-y-4">
