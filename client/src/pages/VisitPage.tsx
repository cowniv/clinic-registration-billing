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

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* invoice */}
        <section className="card space-y-4">
          <h2 className="font-semibold">Charges</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2">Service</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inv.lines.map((li) => (
                <tr key={li.id}>
                  <td className="py-2">{li.description}</td>
                  <td className="py-2 text-right">{li.quantity}</td>
                  <td className="py-2 text-right">{peso(li.unit_price_cents)}</td>
                  <td className="py-2 text-right">{peso(li.amount_cents)}</td>
                  <td className="py-2 text-right">
                    {!locked && can("frontdesk") && (
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => run(() => api(`/visits/${id}/items/${li.id}`, { method: "DELETE" }))}
                      >
                        remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {inv.lines.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    No services yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!locked && can("frontdesk") && (
            <form onSubmit={addItem} className="flex flex-wrap gap-2">
              <select className="input flex-1" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Add a service...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {peso(s.price_cents)}
                  </option>
                ))}
              </select>
              <input type="number" min={1} max={50} className="input w-20" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              <button className="btn" disabled={!serviceId}>
                Add
              </button>
            </form>
          )}

          <dl className="ml-auto max-w-xs space-y-1 text-sm">
            <Row label="Subtotal" value={peso(inv.subtotal_cents)} />
            {inv.discount_cents > 0 && (
              <Row label={`${visit.discount_type === "senior" ? "Senior" : "PWD"} discount (20%)`} value={`− ${peso(inv.discount_cents)}`} />
            )}
            <Row label="Total" value={peso(inv.total_cents)} bold />
            <Row label="Paid" value={peso(inv.paid_cents)} />
            <Row label="Balance" value={peso(inv.balance_cents)} bold />
          </dl>
        </section>

        <aside className="space-y-4">
          {/* discount */}
          <form onSubmit={saveDiscount} className="card space-y-3">
            <h2 className="font-semibold">Discount</h2>
            {isSeniorAge && visit.discount_type === "none" && !locked && (
              <p className="rounded bg-violet-50 px-2 py-1 text-xs text-violet-700">Patient is 60+. Ask for a senior citizen ID.</p>
            )}
            <select className="input" value={discount} disabled={locked} onChange={(e) => setDiscount(e.target.value as DiscountType)}>
              <option value="none">None</option>
              <option value="senior">Senior citizen (20%)</option>
              <option value="pwd">PWD (20%)</option>
            </select>
            {discount !== "none" && (
              <input className="input" placeholder="OSCA / PWD ID number" value={idNo} disabled={locked} onChange={(e) => setIdNo(e.target.value)} />
            )}
            {!locked && can("frontdesk", "cashier") && <button className="btn-ghost w-full">Apply discount</button>}
          </form>

          {/* payment */}
          {visit.status === "open" && can("cashier") && inv.lines.length > 0 && (
            <form onSubmit={pay} className="card space-y-3">
              <h2 className="font-semibold">Record payment</h2>
              <div className="grid grid-cols-3 gap-1">
                {(["cash", "gcash", "card"] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`rounded-lg border px-2 py-1.5 text-sm capitalize ${method === m ? "border-brand bg-brand-light text-brand" : "border-slate-200"}`}
                  >
                    {m === "gcash" ? "GCash" : m}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">Amount</label>
                <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              {method === "cash" ? (
                <div>
                  <label className="label">Cash tendered</label>
                  <input className="input" inputMode="decimal" value={tendered} onChange={(e) => setTendered(e.target.value)} />
                  {tendered && <p className={`mt-1 text-sm ${change < 0 ? "text-red-600" : "text-slate-600"}`}>Change: {peso(Math.max(change, 0))}</p>}
                </div>
              ) : (
                <div>
                  <label className="label">Reference no.</label>
                  <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} />
                </div>
              )}
              <button className="btn w-full">Pay and print receipt</button>
            </form>
          )}

          {inv.payments.length > 0 && (
            <div className="card space-y-2">
              <h2 className="font-semibold">Receipts</h2>
              {inv.payments.map((p) => (
                <Link key={p.id} to={`/receipts/${p.id}`} className="flex justify-between text-sm text-brand hover:underline">
                  <span>{p.receipt_no}</span>
                  <span>{peso(p.amount_cents)}</span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : "text-slate-600"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
