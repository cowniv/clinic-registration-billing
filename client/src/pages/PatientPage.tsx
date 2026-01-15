import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Invoice, type Patient } from "../api";
import { useAuth } from "../auth";
import { age, manilaTime } from "../format";
import { STATUS_STYLE } from "./VisitsPage";

type PatientWithVisits = Patient & {
  visits: { id: number; reason: string | null; status: string; created_at: string }[];
};

export default function PatientPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientWithVisits | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<PatientWithVisits>(`/patients/${id}`)
      .then(setPatient)
      .catch((e) => setError(e.message));
  }, [id]);

  async function startVisit(e: FormEvent) {
    e.preventDefault();
    try {
      const inv = await api<Invoice>("/visits", { body: { patient_id: Number(id), reason } });
      navigate(`/visits/${inv.visit.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }
