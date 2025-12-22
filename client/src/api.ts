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
