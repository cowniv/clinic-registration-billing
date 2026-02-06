import Database from "better-sqlite3";

// All money is stored as integer centavos so we never fight floating point.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('frontdesk', 'cashier', 'admin'))
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
