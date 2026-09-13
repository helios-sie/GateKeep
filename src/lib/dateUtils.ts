export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parses an ISO date string, falling back to today for anything that isn't
// one — e.g. "" from a cleared <input type="date">, or any other malformed
// value. Without this, an invalid date silently produces a Date whose fields
// are all NaN, which then serializes to the literal string "NaN-NaN-NaN" and
// gets fed right back into a date input as its `value`.
function parseISO(dateISO: string): Date {
  const d = new Date(dateISO + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function addDays(dateISO: string, delta: number): string {
  const d = parseISO(dateISO);
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

export function formatDisplay(dateISO: string): string {
  return parseISO(dateISO).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
