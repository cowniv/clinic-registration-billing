import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { manilaTime, peso, todayManila } from "../format";

type Report = {
  date: string;
  total_cents: number;
  by_method: { method: string; count: number; total_cents: number }[];
  visits: { status: string; count: number }[];
  receipts: { id: number; receipt_no: string; method: string; amount_cents: number; created_at: string; patient: string; cashier: string }[];
};

export default function ReportPage() {
  const [date, setDate] = useState(todayManila());
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    api<Report>(`/reports/daily?date=${date}`).then(setReport);
  }, [date]);

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Daily sales report</h1>
        <div className="flex gap-2">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn-ghost" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      {!report ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="print-area space-y-4">
          <p className="hidden text-lg font-bold print:block">Daily sales report · {report.date}</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Total collected" value={peso(report.total_cents)} highlight />
