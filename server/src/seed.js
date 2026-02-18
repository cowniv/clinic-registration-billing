import "dotenv/config";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { openDb } from "./db.js";

export const DEMO_PASSWORD = "clinic123";

const USERS = [
  ["frontdesk", "Rhea Manalo", "frontdesk"],
  ["cashier", "Joel Santos", "cashier"],
  ["admin", "Dr. Carmela Reyes", "admin"],
];

// [code, name, category, price in pesos]
const SERVICES = [
  ["CONS-GEN", "General consultation", "consultation", 500],
  ["CONS-PED", "Pediatric consultation", "consultation", 600],
  ["LAB-CBC", "Complete blood count (CBC)", "laboratory", 250],
  ["LAB-UA", "Urinalysis", "laboratory", 120],
  ["LAB-FBS", "Fasting blood sugar", "laboratory", 150],
  ["LAB-LIPID", "Lipid profile", "laboratory", 700],
  ["IMG-CXR", "Chest X-ray (PA view)", "imaging", 450],
