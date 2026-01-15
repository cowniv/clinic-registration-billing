import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError, type Patient } from "../api";
import { useAuth } from "../auth";
import { age } from "../format";

const EMPTY = { first_name: "", last_name: "", birth_date: "", sex: "F", phone: "", address: "" };

export default function PatientsPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");

  // debounce search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      api<Patient[]>(`/patients?q=${encodeURIComponent(q)}`).then(setResults);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
