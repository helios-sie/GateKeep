export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateISO: string, delta: number): string {
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

export function formatDisplay(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
