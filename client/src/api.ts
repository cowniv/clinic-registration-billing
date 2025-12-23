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
