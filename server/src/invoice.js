import { computeInvoice } from "./billing.js";

// Load a visit with patient, line items, payments and computed totals.
export function loadInvoice(db, visitId) {
  const visit = db
    .prepare(
      `SELECT v.*, p.first_name, p.last_name, p.birth_date, p.sex, u.full_name AS created_by_name
       FROM visits v
       JOIN patients p ON p.id = v.patient_id
       JOIN users u ON u.id = v.created_by
       WHERE v.id = ?`
    )
    .get(visitId);
  if (!visit) return null;

  const items = db
    .prepare(
      `SELECT li.id, li.service_id, li.description, li.quantity, li.unit_price_cents, s.code
       FROM line_items li JOIN services s ON s.id = li.service_id
       WHERE li.visit_id = ? ORDER BY li.id`
    )
    .all(visitId);

  const payments = db
    .prepare(
      `SELECT pay.id, pay.receipt_no, pay.method, pay.amount_cents, pay.tendered_cents, pay.reference,
              pay.created_at, u.full_name AS received_by_name
       FROM payments pay JOIN users u ON u.id = pay.received_by
       WHERE pay.visit_id = ? ORDER BY pay.id`
    )
    .all(visitId);

  const paid = payments.reduce((s, p) => s + p.amount_cents, 0);
  return {
    visit,
    payments,
    ...computeInvoice(items, visit.discount_type, paid),
  };
}
