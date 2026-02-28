import { describe, it, expect } from "vitest";
import { computeInvoice, formatReceiptNo } from "../src/billing.js";

const items = [
  { quantity: 1, unit_price_cents: 50000 }, // consultation
  { quantity: 2, unit_price_cents: 12000 }, // urinalysis x2
];

describe("computeInvoice", () => {
  it("adds up line items without a discount", () => {
    const inv = computeInvoice(items);
    expect(inv.subtotal_cents).toBe(74000);
    expect(inv.discount_cents).toBe(0);
    expect(inv.total_cents).toBe(74000);
  });

  it("applies 20% for senior citizens and PWDs", () => {
    expect(computeInvoice(items, "senior").total_cents).toBe(59200);
    expect(computeInvoice(items, "pwd").discount_cents).toBe(14800);
  });

  it("rounds the discount to the nearest centavo", () => {
    const inv = computeInvoice([{ quantity: 1, unit_price_cents: 333 }], "senior");
    expect(inv.discount_cents).toBe(67);
    expect(inv.total_cents).toBe(266);
  });

