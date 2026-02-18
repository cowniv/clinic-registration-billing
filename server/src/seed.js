import "dotenv/config";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { openDb } from "./db.js";

export const DEMO_PASSWORD = "clinic123";

const USERS = [
  ["frontdesk", "Rhea Manalo", "frontdesk"],
  ["cashier", "Joel Santos", "cashier"],
  ["admin", "Dr. Carmela Reyes", "admin"],
