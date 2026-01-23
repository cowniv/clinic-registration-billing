import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type DiscountType, type Invoice, type Service } from "../api";
import { useAuth } from "../auth";
import { age, peso, toCents } from "../format";
import { STATUS_STYLE } from "./VisitsPage";

export default function VisitPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState<DiscountType>("none");
  const [idNo, setIdNo] = useState("");
  const [method, setMethod] = useState<"cash" | "gcash" | "card">("cash");
  const [amount, setAmount] = useState("");
  const [tendered, setTendered] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Invoice>(`/visits/${id}`).then((data) => {
      setInv(data);
      setDiscount(data.visit.discount_type);
      setIdNo(data.visit.discount_id_no ?? "");
    });
    api<Service[]>("/services").then(setServices);
  }, [id]);

  // keep the amount field in sync with the balance
  useEffect(() => {
    if (inv) setAmount((inv.balance_cents / 100).toFixed(2));
  }, [inv?.balance_cents]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(fn: () => Promise<Invoice>) {
    setError("");
    try {
      setInv(await fn());
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!inv) return <p className="text-slate-500">Loading...</p>;

  const { visit } = inv;
  const locked = visit.status !== "open" || inv.payments.length > 0;
  const isSeniorAge = age(visit.birth_date) >= 60;
  const change = method === "cash" ? toCents(tendered) - toCents(amount) : 0;

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;
    run(() => api(`/visits/${id}/items`, { body: { service_id: Number(serviceId), quantity: qty } }));
    setServiceId("");
    setQty(1);
  };

  const saveDiscount = (e: FormEvent) => {
    e.preventDefault();
    run(() =>
      api(`/visits/${id}/discount`, {
        method: "PUT",
        body: { discount_type: discount, discount_id_no: idNo || undefined },
      })
    );
  };

  async function pay(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api<{ payment_id: number; invoice: Invoice }>(`/visits/${id}/payments`, {
        body: {
          method,
          amount_cents: toCents(amount),
          tendered_cents: method === "cash" ? toCents(tendered || amount) : undefined,
          reference: method === "cash" ? undefined : reference,
        },
      });
      navigate(`/receipts/${res.payment_id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <Link to={`/patients/${visit.patient_id}`} className="text-sm text-brand">
        ← {visit.first_name} {visit.last_name}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Visit #{visit.id}</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[visit.status]}`}>{visit.status}</span>
        {visit.reason && <span className="text-slate-500">{visit.reason}</span>}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
