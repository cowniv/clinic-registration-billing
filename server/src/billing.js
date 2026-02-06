// Pure billing math, kept separate from Express so it is easy to unit test.

export const DISCOUNT_RATE = { none: 0, senior: 0.2, pwd: 0.2 };

/**
 * Compute invoice totals for a visit.
 * Senior citizens (RA 9994) and PWDs (RA 10754) get 20% off.
 * The discount is rounded to the nearest centavo once, on the subtotal.
 */
export function computeInvoice(lineItems, discountType = "none", paidCents = 0) {
  const lines = lineItems.map((li) => ({
    ...li,
    amount_cents: li.quantity * li.unit_price_cents,
  }));
  const subtotal = lines.reduce((sum, li) => sum + li.amount_cents, 0);
  const rate = DISCOUNT_RATE[discountType] ?? 0;
  const discount = Math.round(subtotal * rate);
  const total = subtotal - discount;
  const balance = Math.max(total - paidCents, 0);
  return {
    lines,
    subtotal_cents: subtotal,
    discount_type: discountType,
    discount_cents: discount,
    total_cents: total,
    paid_cents: paidCents,
    balance_cents: balance,
  };
}

export const formatReceiptNo = (n) => `OR-${String(n).padStart(6, "0")}`;
