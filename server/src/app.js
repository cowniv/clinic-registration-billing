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
