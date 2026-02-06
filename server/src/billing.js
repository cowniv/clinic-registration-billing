// Pure billing math, kept separate from Express so it is easy to unit test.

export const DISCOUNT_RATE = { none: 0, senior: 0.2, pwd: 0.2 };

/**
 * Compute invoice totals for a visit.
 * Senior citizens (RA 9994) and PWDs (RA 10754) get 20% off.
 * The discount is rounded to the nearest centavo once, on the subtotal.
