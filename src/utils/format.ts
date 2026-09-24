export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const fmtDT = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${fmtDate(iso)} · ${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
};
export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1e3;
  if (s < 0) return fmtDate(iso);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(iso);
};
export const naira = (n: number | null | undefined) =>
  n == null ? '—' : '₦' + Number(n).toLocaleString('en-NG');
export const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);