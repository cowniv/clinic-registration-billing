import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { signToken, requireAuth, allow } from "./auth.js";
import {
  body,
  loginSchema,
  patientSchema,
  serviceSchema,
  visitSchema,
  discountSchema,
  lineItemSchema,
  paymentSchema,
} from "./validate.js";
import { loadInvoice } from "./invoice.js";
import { formatReceiptNo } from "./billing.js";

const idParam = (req) => Number.parseInt(req.params.id, 10);

export function createApp(db) {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // ---------- auth ----------
  app.post("/api/auth/login", body(loginSchema), (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(req.body.username);
    if (!user || !bcrypt.compareSync(req.body.password, user.password_hash)) {
      return res.status(401).json({ error: "Wrong username or password" });
    }
    res.json({
      token: signToken(user),
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
    });
  });

  app.use("/api", requireAuth);
  app.get("/api/auth/me", (req, res) => res.json({ user: req.user }));

  // ---------- patients ----------
  app.get("/api/patients", (req, res) => {
    const q = String(req.query.q || "").trim();
    const like = `%${q}%`;
    const rows = db
      .prepare(
        `SELECT * FROM patients
         WHERE ? = '' OR first_name LIKE ? OR last_name LIKE ? OR (first_name || ' ' || last_name) LIKE ? OR phone LIKE ?
         ORDER BY last_name, first_name LIMIT 50`
      )
      .all(q, like, like, like, like);
    res.json(rows);
  });

  app.post("/api/patients", allow("frontdesk"), body(patientSchema), (req, res) => {
    const p = req.body;
    const dupe = db
      .prepare("SELECT id FROM patients WHERE lower(first_name) = lower(?) AND lower(last_name) = lower(?) AND birth_date = ?")
      .get(p.first_name, p.last_name, p.birth_date);
    if (dupe) return res.status(409).json({ error: "This patient is already registered", id: dupe.id });

    const info = db
      .prepare("INSERT INTO patients (first_name, last_name, birth_date, sex, phone, address) VALUES (?, ?, ?, ?, ?, ?)")
      .run(p.first_name, p.last_name, p.birth_date, p.sex, p.phone || null, p.address || null);
    res.status(201).json(db.prepare("SELECT * FROM patients WHERE id = ?").get(info.lastInsertRowid));
  });

  app.get("/api/patients/:id", (req, res) => {
    const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(idParam(req));
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    const visits = db
      .prepare("SELECT id, reason, status, discount_type, created_at FROM visits WHERE patient_id = ? ORDER BY id DESC")
      .all(patient.id);
    res.json({ ...patient, visits });
  });

  app.put("/api/patients/:id", allow("frontdesk"), body(patientSchema), (req, res) => {
    const p = req.body;
    const info = db
      .prepare("UPDATE patients SET first_name=?, last_name=?, birth_date=?, sex=?, phone=?, address=? WHERE id=?")
      .run(p.first_name, p.last_name, p.birth_date, p.sex, p.phone || null, p.address || null, idParam(req));
    if (!info.changes) return res.status(404).json({ error: "Patient not found" });
    res.json(db.prepare("SELECT * FROM patients WHERE id = ?").get(idParam(req)));
  });

  // ---------- services catalog ----------
  app.get("/api/services", (req, res) => {
    const all = req.query.all === "1" && req.user.role === "admin";
    const rows = db
      .prepare(`SELECT * FROM services ${all ? "" : "WHERE active = 1"} ORDER BY category, name`)
      .all();
    res.json(rows.map((s) => ({ ...s, active: !!s.active })));
  });

  app.post("/api/services", allow(), body(serviceSchema), (req, res) => {
    const s = req.body;
    try {
      const info = db
        .prepare("INSERT INTO services (code, name, category, price_cents, active) VALUES (?, ?, ?, ?, ?)")
        .run(s.code, s.name, s.category, s.price_cents, s.active === false ? 0 : 1);
      res.status(201).json(db.prepare("SELECT * FROM services WHERE id = ?").get(info.lastInsertRowid));
    } catch (e) {
      if (String(e.message).includes("UNIQUE")) return res.status(409).json({ error: "Service code already exists" });
      throw e;
    }
  });

  app.patch("/api/services/:id", allow(), body(serviceSchema.partial()), (req, res) => {
    const current = db.prepare("SELECT * FROM services WHERE id = ?").get(idParam(req));
    if (!current) return res.status(404).json({ error: "Service not found" });
    const s = { ...current, ...req.body };
    db.prepare("UPDATE services SET code=?, name=?, category=?, price_cents=?, active=? WHERE id=?").run(
      s.code,
      s.name,
      s.category,
      s.price_cents,
      s.active ? 1 : 0,
