// crypto.randomUUID() only works in a "secure context" — HTTPS, or
// localhost. Over a plain http://<lan-ip> URL (e.g. testing on a phone via
// the dev server's --host address) it's undefined, and calling it throws,
// which silently breaks whatever was being saved. This generates an
// equivalent random id everywhere, falling back to Math.random when the
// native API isn't available.
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
