import { computeInvoice } from "./billing.js";

// Load a visit with patient, line items, payments and computed totals.
export function loadInvoice(db, visitId) {
  const visit = db
    .prepare(
      `SELECT v.*, p.first_name, p.last_name, p.birth_date, p.sex, u.full_name AS created_by_name
       FROM visits v
       JOIN patients p ON p.id = v.patient_id
       JOIN users u ON u.id = v.created_by
