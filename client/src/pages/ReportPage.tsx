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
            {["cash", "gcash", "card"].map((m) => {
              const row = report.by_method.find((r) => r.method === m);
              return <Stat key={m} label={`${m === "gcash" ? "GCash" : m} (${row?.count ?? 0})`} value={peso(row?.total_cents ?? 0)} />;
            })}
          </div>
          <p className="text-sm text-slate-500">
            Visits:{" "}
            {report.visits.length === 0 ? "none" : report.visits.map((v) => `${v.count} ${v.status}`).join(" · ")}
          </p>
          <div className="card p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Receipt</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Patient</th>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">Cashier</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">
                      <Link to={`/receipts/${r.id}`} className="text-brand hover:underline">
                        {r.receipt_no}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{manilaTime(r.created_at)}</td>
                    <td className="px-4 py-2">{r.patient}</td>
                    <td className="px-4 py-2 capitalize">{r.method}</td>
                    <td className="px-4 py-2">{r.cashier}</td>
                    <td className="px-4 py-2 text-right">{peso(r.amount_cents)}</td>
                  </tr>
                ))}
                {report.receipts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No payments on this day
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card ${highlight ? "border-brand bg-brand-light" : ""}`}>
      <p className="text-xs font-semibold uppercase capitalize text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
