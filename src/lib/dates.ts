// lib/dates.ts — tiny local-date helpers (no timezone surprises).

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// "2026-06-23" for a given Date (local time).
export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toKey(new Date());
}

// Parse "2026-06-23" back to a local Date.
export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "MON 23 JUN"
export function headerLabel(key: string): string {
  const d = fromKey(key);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// single-letter weekday for compact grids
export function shortDay(key: string): string {
  return DAYS[fromKey(key).getDay()][0];
}

// The last n date keys ending today, oldest -> newest.
export function lastNKeys(n: number, end: string = todayKey()): string[] {
  const endDate = fromKey(end);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    out.push(toKey(d));
  }
  return out;
}
