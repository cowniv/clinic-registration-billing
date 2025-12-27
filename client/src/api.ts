// Tiny fetch wrapper: adds the JWT and turns error responses into exceptions.

export type Role = "frontdesk" | "cashier" | "admin";
export type User = { id: number; username: string; full_name: string; role: Role };

export type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  sex: "M" | "F";
  phone: string | null;
  address: string | null;
};

export type Service = { id: number; code: string; name: string; category: string; price_cents: number };

export type Line = {
  id: number;
  code: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
};

export type Payment = {
  id: number;
  receipt_no: string;
  method: "cash" | "gcash" | "card";
  amount_cents: number;
  tendered_cents: number;
  reference: string | null;
  created_at: string;
  received_by_name: string;
};

export type DiscountType = "none" | "senior" | "pwd";

export type Invoice = {
  visit: {
    id: number;
    patient_id: number;
    reason: string | null;
    status: "open" | "paid" | "void";
    discount_type: DiscountType;
    discount_id_no: string | null;
    created_at: string;
    first_name: string;
    last_name: string;
    birth_date: string;
  };
  lines: Line[];
  payments: Payment[];
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string[]>) {
    super(message);
  }
}

const TOKEN_KEY = "clinic.token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
