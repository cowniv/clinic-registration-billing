import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { openDb } from "../src/db.js";
import { createApp } from "../src/app.js";
import { seed, DEMO_PASSWORD } from "../src/seed.js";

let app;
const tokens = {};

const as = (role) => ({ Authorization: `Bearer ${tokens[role]}` });

beforeAll(async () => {
  const db = openDb(":memory:");
  seed(db);
  app = createApp(db);
  for (const role of ["frontdesk", "cashier", "admin"]) {
    const res = await request(app).post("/api/auth/login").send({ username: role, password: DEMO_PASSWORD });
    tokens[role] = res.body.token;
  }
});

describe("auth", () => {
  it("rejects a wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "admin", password: "nope" });
    expect(res.status).toBe(401);
  });

  it("blocks requests without a token", async () => {
    expect((await request(app).get("/api/patients")).status).toBe(401);
  });
});

describe("patients", () => {
  it("searches by name", async () => {
    const res = await request(app).get("/api/patients?q=dela").set(as("frontdesk"));
    expect(res.status).toBe(200);
    expect(res.body[0].last_name).toBe("Dela Cruz");
  });

  it("validates new patients", async () => {
    const res = await request(app)
      .post("/api/patients")
      .set(as("frontdesk"))
      .send({ first_name: "", last_name: "X", birth_date: "bad", sex: "M" });
    expect(res.status).toBe(400);
    expect(res.body.fields.first_name).toBeDefined();
  });

  it("does not let the cashier register patients", async () => {
    const res = await request(app)
      .post("/api/patients")
      .set(as("cashier"))
      .send({ first_name: "A", last_name: "B", birth_date: "2000-01-01", sex: "M" });
    expect(res.status).toBe(403);
  });

  it("flags duplicates", async () => {
    const res = await request(app)
      .post("/api/patients")
      .set(as("frontdesk"))
      .send({ first_name: "maria", last_name: "dela cruz", birth_date: "1956-04-12", sex: "F" });
    expect(res.status).toBe(409);
  });
});

describe("visit to receipt", () => {
  it("bills a senior, takes cash, and shows up in the daily report", async () => {
    const services = (await request(app).get("/api/services").set(as("frontdesk"))).body;
    const cons = services.find((s) => s.code === "CONS-GEN"); // 500.00
    const cbc = services.find((s) => s.code === "LAB-CBC"); // 250.00

    let res = await request(app).post("/api/visits").set(as("frontdesk")).send({ patient_id: 1, reason: "Check-up" });
    expect(res.status).toBe(201);
    const visitId = res.body.visit.id;

    await request(app).post(`/api/visits/${visitId}/items`).set(as("frontdesk")).send({ service_id: cons.id });
    res = await request(app).post(`/api/visits/${visitId}/items`).set(as("frontdesk")).send({ service_id: cbc.id });
    expect(res.body.subtotal_cents).toBe(75000);

    res = await request(app)
      .put(`/api/visits/${visitId}/discount`)
      .set(as("frontdesk"))
      .send({ discount_type: "senior" });
    expect(res.status).toBe(400); // ID number missing

    res = await request(app)
      .put(`/api/visits/${visitId}/discount`)
      .set(as("frontdesk"))
      .send({ discount_type: "senior", discount_id_no: "SC-2231" });
    expect(res.body.total_cents).toBe(60000);

    // front desk can't take money
    res = await request(app)
      .post(`/api/visits/${visitId}/payments`)
      .set(as("frontdesk"))
      .send({ method: "cash", amount_cents: 60000 });
    expect(res.status).toBe(403);

    res = await request(app)
      .post(`/api/visits/${visitId}/payments`)
      .set(as("cashier"))
      .send({ method: "cash", amount_cents: 70000, tendered_cents: 100000 });
    expect(res.status).toBe(400); // over the balance

    res = await request(app)
      .post(`/api/visits/${visitId}/payments`)
      .set(as("cashier"))
      .send({ method: "cash", amount_cents: 60000, tendered_cents: 100000 });
    expect(res.status).toBe(201);
    expect(res.body.invoice.visit.status).toBe("paid");
    expect(res.body.invoice.balance_cents).toBe(0);

    const receipt = await request(app).get(`/api/payments/${res.body.payment_id}/receipt`).set(as("cashier"));
    expect(receipt.body.payment.receipt_no).toBe("OR-000001");
    expect(receipt.body.payment.change_cents).toBe(40000);

    // invoice is locked now
    res = await request(app).post(`/api/visits/${visitId}/items`).set(as("frontdesk")).send({ service_id: cbc.id });
    expect(res.status).toBe(409);

    const report = await request(app).get("/api/reports/daily").set(as("cashier"));
    expect(report.body.total_cents).toBe(60000);
    expect(report.body.by_method[0]).toMatchObject({ method: "cash", count: 1 });
  });

  it("requires a reference for GCash", async () => {
    const v = await request(app).post("/api/visits").set(as("frontdesk")).send({ patient_id: 2 });
    const res = await request(app)
      .post(`/api/visits/${v.body.visit.id}/payments`)
      .set(as("cashier"))
      .send({ method: "gcash", amount_cents: 100 });
    expect(res.status).toBe(400);
  });

  it("keeps the daily report away from the front desk", async () => {
    expect((await request(app).get("/api/reports/daily").set(as("frontdesk"))).status).toBe(403);
  });
});
