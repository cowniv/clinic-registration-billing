export const peso = (cents: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(cents / 100);

// "250" or "250.50" -> 25050
export const toCents = (value: string) => Math.round(Number.parseFloat(value || "0") * 100);

// SQLite datetime('now') is UTC without a "Z"
export const manilaTime = (sqlDate: string) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(sqlDate.replace(" ", "T") + "Z"));

export const todayManila = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);

export function age(birthDate: string) {
  const b = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) years--;
  return years;
}
