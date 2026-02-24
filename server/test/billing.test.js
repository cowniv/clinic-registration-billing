import { describe, it, expect } from "vitest";
import { computeInvoice, formatReceiptNo } from "../src/billing.js";

const items = [
  { quantity: 1, unit_price_cents: 50000 }, // consultation
  { quantity: 2, unit_price_cents: 12000 }, // urinalysis x2
];

describe("computeInvoice", () => {
