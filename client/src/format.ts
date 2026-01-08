export const peso = (cents: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(cents / 100);

// "250" or "250.50" -> 25050
export const toCents = (value: string) => Math.round(Number.parseFloat(value || "0") * 100);

