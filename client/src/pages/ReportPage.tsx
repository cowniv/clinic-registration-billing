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
