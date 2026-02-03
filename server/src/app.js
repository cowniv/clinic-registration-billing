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
      current.id
    );
    res.json(db.prepare("SELECT * FROM services WHERE id = ?").get(current.id));
  });

  // ---------- visits & invoices ----------
  app.get("/api/visits", (req, res) => {
    const date = req.query.date || null; // YYYY-MM-DD, Manila time
    const rows = db
      .prepare(
        `SELECT v.id, v.status, v.reason, v.created_at, p.first_name, p.last_name
         FROM visits v JOIN patients p ON p.id = v.patient_id
         WHERE (? IS NULL OR date(v.created_at, '+8 hours') = ?)
         ORDER BY v.id DESC LIMIT 100`
      )
      .all(date, date);
    res.json(rows);
  });

  app.post("/api/visits", allow("frontdesk"), body(visitSchema), (req, res) => {
    const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(req.body.patient_id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    const info = db
      .prepare("INSERT INTO visits (patient_id, reason, created_by) VALUES (?, ?, ?)")
      .run(patient.id, req.body.reason || null, req.user.id);
    res.status(201).json(loadInvoice(db, info.lastInsertRowid));
  });

  app.get("/api/visits/:id", (req, res) => {
    const inv = loadInvoice(db, idParam(req));
    if (!inv) return res.status(404).json({ error: "Visit not found" });
    res.json(inv);
  });

  // Charges can only change while the invoice is open and nothing has been paid yet.
  const editableVisit = (req, res, next) => {
    const v = db.prepare("SELECT status FROM visits WHERE id = ?").get(idParam(req));
    if (!v) return res.status(404).json({ error: "Visit not found" });
    const paid = db.prepare("SELECT COUNT(*) AS n FROM payments WHERE visit_id = ?").get(idParam(req)).n;
    if (v.status !== "open" || paid > 0) {
      return res.status(409).json({ error: "Invoice is locked once a payment is recorded" });
    }
    next();
  };

  app.post("/api/visits/:id/items", allow("frontdesk"), editableVisit, body(lineItemSchema), (req, res) => {
    const svc = db.prepare("SELECT * FROM services WHERE id = ? AND active = 1").get(req.body.service_id);
    if (!svc) return res.status(404).json({ error: "Service not found" });
    // Copy the price so later catalog changes don't rewrite old invoices.
    db.prepare(
      "INSERT INTO line_items (visit_id, service_id, description, quantity, unit_price_cents) VALUES (?, ?, ?, ?, ?)"
    ).run(idParam(req), svc.id, svc.name, req.body.quantity, svc.price_cents);
    res.status(201).json(loadInvoice(db, idParam(req)));
  });

  app.delete("/api/visits/:id/items/:itemId", allow("frontdesk"), editableVisit, (req, res) => {
    const info = db
      .prepare("DELETE FROM line_items WHERE id = ? AND visit_id = ?")
      .run(Number(req.params.itemId), idParam(req));
    if (!info.changes) return res.status(404).json({ error: "Line item not found" });
    res.json(loadInvoice(db, idParam(req)));
  });

  app.put("/api/visits/:id/discount", allow("frontdesk", "cashier"), editableVisit, body(discountSchema), (req, res) => {
    db.prepare("UPDATE visits SET discount_type = ?, discount_id_no = ? WHERE id = ?").run(
      req.body.discount_type,
      req.body.discount_type === "none" ? null : req.body.discount_id_no,
      idParam(req)
    );
    res.json(loadInvoice(db, idParam(req)));
  });

  app.post("/api/visits/:id/void", allow(), (req, res) => {
    const inv = loadInvoice(db, idParam(req));
    if (!inv) return res.status(404).json({ error: "Visit not found" });
    if (inv.payments.length) return res.status(409).json({ error: "Can't void a visit that has payments" });
    db.prepare("UPDATE visits SET status = 'void' WHERE id = ?").run(inv.visit.id);
    res.json(loadInvoice(db, inv.visit.id));
  });

  // ---------- payments ----------
  const recordPayment = db.transaction((visitId, p, userId) => {
    const inv = loadInvoice(db, visitId);
    if (!inv) return { status: 404, error: "Visit not found" };
    if (inv.visit.status !== "open") return { status: 409, error: `Visit is already ${inv.visit.status}` };
    if (inv.lines.length === 0) return { status: 409, error: "Add at least one service first" };
    if (p.amount_cents > inv.balance_cents) return { status: 400, error: "Amount is more than the balance" };

    const tendered = p.method === "cash" ? p.tendered_cents ?? p.amount_cents : p.amount_cents;
    if (tendered < p.amount_cents) return { status: 400, error: "Cash tendered is less than the amount" };

    const next = db.prepare("SELECT COUNT(*) AS n FROM payments").get().n + 1;
    const info = db
      .prepare(
        `INSERT INTO payments (visit_id, receipt_no, method, amount_cents, tendered_cents, reference, received_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(visitId, formatReceiptNo(next), p.method, p.amount_cents, tendered, p.reference || null, userId);

    if (p.amount_cents === inv.balance_cents) {
      db.prepare("UPDATE visits SET status = 'paid' WHERE id = ?").run(visitId);
    }
    return { status: 201, paymentId: info.lastInsertRowid };
  });

  app.post("/api/visits/:id/payments", allow("cashier"), body(paymentSchema), (req, res) => {
    const result = recordPayment(idParam(req), req.body, req.user.id);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.status(201).json({ payment_id: result.paymentId, invoice: loadInvoice(db, idParam(req)) });
  });

  app.get("/api/payments/:id/receipt", (req, res) => {
    const pay = db.prepare("SELECT * FROM payments WHERE id = ?").get(idParam(req));
    if (!pay) return res.status(404).json({ error: "Receipt not found" });
    const invoice = loadInvoice(db, pay.visit_id);
    const payment = invoice.payments.find((p) => p.id === pay.id);
    res.json({
      clinic: {
