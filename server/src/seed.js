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
  ["IMG-ECG", "12-lead ECG", "imaging", 400],
  ["PROC-WND", "Wound dressing", "procedure", 300],
  ["PROC-NEB", "Nebulization", "procedure", 250],
  ["OTH-MEDCERT", "Medical certificate", "other", 150],
];

const PATIENTS = [
  ["Maria", "Dela Cruz", "1956-04-12", "F", "09171234567", "Brgy. Dolores, San Fernando"],
  ["Jose", "Bautista", "1988-11-02", "M", "09281234567", "Brgy. Sindalan, San Fernando"],
  ["Ana", "Villanueva", "2015-07-21", "F", "09991234567", "Brgy. Del Pilar, San Fernando"],
  ["Ramon", "Garcia", "1949-01-30", "M", "", "Brgy. Telabastagan, San Fernando"],
