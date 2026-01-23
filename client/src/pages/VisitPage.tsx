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
