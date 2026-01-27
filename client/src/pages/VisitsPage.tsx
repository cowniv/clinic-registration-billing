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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today's visits</h1>
        <Link to="/patients" className="btn">
          + New visit
        </Link>
      </div>
      <div className="card p-0">
        {rows === null ? (
          <p className="p-5 text-sm text-slate-500">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No visits yet today. Find or register a patient to start one.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((v) => (
              <li key={v.id}>
                <Link to={`/visits/${v.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <span className="w-14 text-xs text-slate-400">#{v.id}</span>
                  <span className="font-medium">
                    {v.last_name}, {v.first_name}
                  </span>
                  <span className="truncate text-sm text-slate-500">{v.reason}</span>
                  <span className="ml-auto text-xs text-slate-400">{manilaTime(v.created_at)}</span>
