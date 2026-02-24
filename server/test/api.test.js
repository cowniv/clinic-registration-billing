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

