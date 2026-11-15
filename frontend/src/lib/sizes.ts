/** The shop's size order (as on the backend): letters, then waist sizes, then kids' ages, then the rest. */
const LETTERS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
const KIDS = ["0-6M", "6-12M", "1-2Y", "2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y", "9-10Y", "10-11Y", "11-12Y", "12-13Y"];

export function sizeRank(size: string): number {
  const s = size.trim().toUpperCase();
  if (LETTERS.includes(s)) return 10 + LETTERS.indexOf(s);
  if (/^\d{2}$/.test(s)) return 100 + Number(s);
  if (KIDS.includes(s)) return 300 + KIDS.indexOf(s);
  return s === "FREE" || s === "ONE SIZE" ? 500 : 900;
}

export const bySize = (a: string, b: string) => sizeRank(a) - sizeRank(b) || a.localeCompare(b);
