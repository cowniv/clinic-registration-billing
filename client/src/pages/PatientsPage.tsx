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

  async function register(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setMessage("");
    try {
      const p = await api<Patient>("/patients", { body: form });
      navigate(`/patients/${p.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        setMessage(err.message);
      }
    }
  }

  const field = (name: keyof typeof EMPTY, label: string, type = "text") => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        className="input"
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name][0]}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
        {can("frontdesk") && (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Close" : "+ Register patient"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={register} className="card grid gap-4 sm:grid-cols-2">
          {field("first_name", "First name")}
          {field("last_name", "Last name")}
          {field("birth_date", "Birth date", "date")}
          <div>
            <label className="label" htmlFor="sex">Sex</label>
            <select id="sex" className="input" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
              <option value="F">Female</option>
              <option value="M">Male</option>
            </select>
          </div>
          {field("phone", "Mobile (09XXXXXXXXX)")}
          {field("address", "Address")}
          <div className="flex items-center gap-3 sm:col-span-2">
            <button className="btn">Save patient</button>
            {message && <p className="text-sm text-red-600">{message}</p>}
          </div>
        </form>
      )}

      <input
        className="input"
        placeholder="Search by name or mobile number..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      <div className="card p-0">
        {results.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No matching patients.</p>
