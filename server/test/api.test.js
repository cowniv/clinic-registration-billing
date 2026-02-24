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
