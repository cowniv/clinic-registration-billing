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

