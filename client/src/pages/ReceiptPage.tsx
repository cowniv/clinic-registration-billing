import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Invoice, type Payment } from "../api";
import { manilaTime, peso } from "../format";

type Receipt = {
  clinic: { name: string; address: string };
  payment: Payment & { change_cents: number };
  invoice: Invoice;
};

export default function ReceiptPage() {
  const { id } = useParams();
  const [data, setData] = useState<Receipt | null>(null);

  useEffect(() => {
    api<Receipt>(`/payments/${id}/receipt`).then(setData);
  }, [id]);

  if (!data) return <p className="text-slate-500">Loading...</p>;
  const { clinic, payment, invoice } = data;

  return (
    <div className="space-y-4">
      <div className="no-print flex gap-2">
        <Link to={`/visits/${invoice.visit.id}`} className="btn-ghost">
          ← Back to visit
        </Link>
        <button className="btn" onClick={() => window.print()}>
          Print receipt
        </button>
      </div>

      <article className="print-area card mx-auto max-w-sm font-mono text-sm">
        <header className="text-center">
          <p className="font-bold">{clinic.name}</p>
          <p className="text-xs">{clinic.address}</p>
          <p className="mt-2 font-bold">OFFICIAL RECEIPT</p>
          <p>{payment.receipt_no}</p>
          <p className="text-xs">{manilaTime(payment.created_at)}</p>
        </header>
        <hr className="my-3 border-dashed" />
        <p>
          Patient: {invoice.visit.last_name}, {invoice.visit.first_name}
        </p>
        <p>Visit #: {invoice.visit.id}</p>
        <hr className="my-3 border-dashed" />
        {invoice.lines.map((li) => (
          <div key={li.id} className="flex justify-between gap-2">
            <span>
              {li.quantity} x {li.description}
            </span>
            <span>{peso(li.amount_cents)}</span>
          </div>
        ))}
        <hr className="my-3 border-dashed" />
        <Line label="Subtotal" value={peso(invoice.subtotal_cents)} />
        {invoice.discount_cents > 0 && (
          <>
            <Line label={`Less 20% ${invoice.visit.discount_type.toUpperCase()}`} value={`-${peso(invoice.discount_cents)}`} />
            <p className="text-xs">ID: {invoice.visit.discount_id_no}</p>
          </>
        )}
        <Line label="TOTAL" value={peso(invoice.total_cents)} bold />
        <hr className="my-3 border-dashed" />
        <Line label={`Paid (${payment.method.toUpperCase()})`} value={peso(payment.amount_cents)} />
        {payment.method === "cash" ? (
          <>
            <Line label="Cash" value={peso(payment.tendered_cents)} />
            <Line label="Change" value={peso(payment.change_cents)} />
          </>
        ) : (
          <Line label="Ref" value={payment.reference ?? ""} />
