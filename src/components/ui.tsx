import {
  createContext, useCallback, useContext, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';
import { initials } from '../utils/format';

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

/* ── Icons (prototype sprite) ── */
const ICONS: Record<string, string[]> = {
  menu: ['M4 7h16M4 12h16M4 17h16'],
  x: ['M6 6l12 12M18 6L6 18'],
  bell: ['M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9', 'M10.3 20.5a2 2 0 0 0 3.4 0'],
  'arrow-r': ['M4 12h15M13 6l6 6-6 6'],
  'chev-r': ['M9 5.5 15.5 12 9 18.5'],
  send: ['M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z'],
  check: ['M4.5 12.5 9.5 17.5 19.5 7'],
  'check-c': ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M8.5 12.5l2.5 2.5 5-5.5'],
  alert: ['M12 3 2.5 19.5h19L12 3z', 'M12 9.5V14M12 17h.01'],
  file: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z', 'M14 3v5h5M8.5 13h7M8.5 16.5h7'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20.5 20.5 16 16'],
  plus: ['M12 5v14M5 12h14'],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3.2 2'],
  copy: ['M9 9h11v11H9z', 'M5 15h-.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5'],
  user: ['M12 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z', 'M5 20.5c1-3.4 3.7-5.2 7-5.2s6 1.8 7 5.2'],
  inbox: ['M2.5 12.5 5.5 5h13l3 7.5V19h-19v-6.5z', 'M2.5 12.5h5l1.5 2.5h6l1.5-2.5h5'],
  bulb: ['M8.5 18.5h7M9.8 21.5h4.4', 'M12 3a6 6 0 0 0-3.3 11c.7.5 1.1 1.2 1.2 2h4.2c.1-.8.5-1.5 1.2-2A6 6 0 0 0 12 3z'],
  shield: ['M12 2.5 4.5 5.8V11c0 4.8 3.2 9 7.5 10.6 4.3-1.6 7.5-5.8 7.5-10.6V5.8L12 2.5z'],
};

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={cn('ic', className)} aria-hidden viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {(ICONS[name] ?? []).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/* ── Buttons ── */
type BtnVariant = 'primary' | 'ghost' | 'danger' | 'dangerOutline' | 'light' | 'lightOutline';
export function Button({ variant = 'primary', size, className, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' }) {
  const v = {
    primary: 'btn-primary', ghost: 'btn-ghost', danger: 'btn-danger',
    dangerOutline: 'btn-danger-o', light: 'btn-light', lightOutline: 'btn-light-o',
  }[variant];
  return <button className={cn('btn', v, size === 'sm' && 'btn-sm', className)} {...props} />;
}

/* ── Status badges (prototype vocabulary) ── */
export const STATUS_META: Record<string, { label: string; tone: string }> = {
  submitted: { label: 'Submitted', tone: 'b-gray' },
  assigned: { label: 'Assigned', tone: 'b-mint' },
  under_review: { label: 'Under Review', tone: 'b-amber' },
  info_requested: { label: 'Info Requested', tone: 'b-amber-o' },
  escalated: { label: 'Escalated', tone: 'b-red' },
  presidential_review: { label: 'Presidential Review', tone: 'b-red' },
  in_progress: { label: 'In Progress', tone: 'b-amber' },
  resolved: { label: 'Resolved', tone: 'b-gfill' },
  closed: { label: 'Closed', tone: 'b-fill' },
  rejected: { label: 'Rejected', tone: 'b-rfill' },
  accepted: { label: 'Accepted', tone: 'b-gfill' },
  implemented: { label: 'Implemented', tone: 'b-teal' },
  declined: { label: 'Declined', tone: 'b-rfill' },
  pending: { label: 'Pending', tone: 'b-amber' },
  changes_requested: { label: 'Changes Requested', tone: 'b-red' },
  resubmitted: { label: 'Resubmitted', tone: 'b-teal' },
  approved: { label: 'Approved', tone: 'b-gfill' },
  draft: { label: 'Draft', tone: 'b-gray' },
  planned: { label: 'Planned', tone: 'b-gray' },
  upcoming: { label: 'Upcoming', tone: 'b-amber' },
  current: { label: 'Current', tone: 'b-gfill' },
  transitioning: { label: 'Transitioning', tone: 'b-amber' },
  completed: { label: 'Completed', tone: 'b-mint' },
  archived: { label: 'Archived', tone: 'b-gray' },
  active: { label: 'Active', tone: 'b-mint' },
  ended: { label: 'Ended', tone: 'b-gray' },
  published: { label: 'Published', tone: 'b-gfill' },
};
const LEGACY_TONES: Record<string, string> = {
  gray: 'b-gray', green: 'b-mint', gold: 'b-amber', blue: 'b-teal', red: 'b-red',
};
export function Badge({ status, tone, children }: {
  status?: string; tone?: string; children?: ReactNode;
}) {
  if (status !== undefined) {
    const m = STATUS_META[status] ?? { label: status, tone: 'b-gray' };
    return <span className={cn('badge', m.tone)}>{m.label}</span>;
  }
  return <span className={cn('badge', LEGACY_TONES[tone ?? 'gray'] ?? 'b-gray')}>{children}</span>;
}
export function statusTone(s: string) {
  return ({ current: 'green', active: 'green', published: 'green', completed: 'green',
    resolved: 'green', planned: 'blue', upcoming: 'blue', transitioning: 'gold',
    archived: 'gray', ended: 'gray' } as Record<string, string>)[s] ?? 'gray';
}
export function Prio({ value }: { value: string }) {
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return <span className="prio" data-p={label}>{label} priority</span>;
}

/* ── Avatars ── */
const AV_TONES = ['t1', 't2', 't3', 't4', 't5'];
export function Avatar({ name, src, size = 44, rounded }: {
  name: string; src?: string | null; size?: number; rounded?: boolean;
}) {
  const tone = AV_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5];
  return (
    <span className={cn('avatar', tone)} style={{ ['--av' as string]: `${size}px`, ...(rounded ? { borderRadius: '14px' } : {}) }}>
      <b>{initials(name)}</b>
      {src && <img src={src} alt={name} />}
    </span>
  );
}

/* ── Panels ── */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('panel', className)}>{children}</div>;
}
export const Card = Panel;
export function PanelHead({ title, right, children }: { title: ReactNode; right?: ReactNode; children?: ReactNode }) {
  return <div className="panel-hd"><h3>{title}</h3>{right ?? children}</div>;
}
export function PanelBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('panel-bd', className)}>{children}</div>;
}

/* ── Stats ── */
export function StatStrip({ children }: { children: ReactNode }) {
  return <div className="stat-strip">{children}</div>;
}
export function Stat({ value, label, to }: { value: ReactNode; label: string; to?: string }) {
  const inner = <><b>{value}</b><span>{label}</span></>;
  return to ? <Link to={to} className="stat">{inner}</Link> : <div className="stat">{inner}</div>;
}

/* ── Forms ── */
export const inputClass = 'input';
export function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: ReactNode;
}) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      {children}
      {hint && <div className="hint">{hint}</div>}
      {error && <div className="ferr">{error}</div>}
    </div>
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input" {...props} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input" {...props} />;
}
export function FormError({ children }: { children: ReactNode }) {
  return <div className="form-err"><Icon name="alert" />{children}</div>;
}
export function Banner({ children }: { children: ReactNode }) {
  return <div className="banner"><Icon name="alert" />{children}</div>;
}

/* ── Page header ── */
export function PageHeader({ title, subtitle, right }: {
  title: string; subtitle?: string; right?: ReactNode;
}) {
  return (
    <div className="ph-hd">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="sub">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/* ── Ticket ── */
export function Ticket({ reference, tracking, onCopy }: {
  reference: string; tracking?: string | null; onCopy?: () => void;
}) {
  return (
    <div>
      <div className="tick-ref stamp-in">
        <div>
          <div className="fine" style={{ textTransform: 'uppercase', letterSpacing: '.1em' }}>Reference number</div>
          <span>{reference}</span>
        </div>
        {onCopy && <Button variant="ghost" size="sm" type="button" onClick={onCopy}><Icon name="copy" className="ic-sm" /> Copy</Button>}
      </div>
      {tracking && (
        <div className="banner">
          <span>
            <b>Save your tracking code — shown only once:</b> <code>{tracking}</code>.
            It is the only way to check this anonymous submission. Your identity was not stored.
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Timeline ── */
export interface TlItem {
  title: string; by?: string | null; time: string;
  message?: string | null; tone?: 'grn' | 'red' | 'amb' | '';
}
export function Timeline({ items }: { items: TlItem[] }) {
  return (
    <ul className="tl">
      {items.map((it, i) => (
        <li key={i} className={it.tone ?? ''}>
          <span className="tl-ic">
            <Icon name={it.tone === 'red' ? 'alert' : it.tone === 'grn' ? 'check-c' : 'clock'} className="ic-sm" />
          </span>
          <div className="tl-head"><strong>{it.title}</strong><span className="tl-time">{it.time}</span></div>
          {it.by && <div className="tl-meta">by {it.by}</div>}
          {it.message && <div className="tl-msg">{it.message}</div>}
        </li>
      ))}
    </ul>
  );
}

/* ── Meta grid ── */
export function MetaGrid({ children }: { children: ReactNode }) {
  return <div className="meta-grid">{children}</div>;
}
export function MetaCell({ label, children }: { label: string; children: ReactNode }) {
  return <div className="meta-cell"><small>{label}</small><b>{children}</b></div>;
}

/* ── Empty / loading ── */
export function EmptyState({ title, description, action }: {
  title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Icon name="inbox" className="ic-lg" />
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function Spinner() {
  return <div className="spin" />;
}
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="panel">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel-row">
          <div className="skel" style={{ width: 90, height: 12 }} />
          <div style={{ flex: 1 }}>
            <div className="skel" style={{ width: '60%', height: 14, marginBottom: 8 }} />
            <div className="skel" style={{ width: '35%', height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Modal ── */
export function Modal({ open, onClose, title, desc, children, footer }: {
  open: boolean; onClose: () => void; title: string; desc?: string;
  children?: ReactNode; footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="ovl" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-head">
          <h3>{title}</h3>
          <button className="m-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        {desc && <p className="m-desc">{desc}</p>}
        {children}
        {footer && <div className="m-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Toasts ── */
type ToastFn = (text: string, err?: boolean) => void;
const ToastCtx = createContext<ToastFn>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; text: string; err?: boolean }[]>([]);
  const push = useCallback<ToastFn>((text, err = false) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, err }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div id="toast-root" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cn('toast', t.err && 'err')}>
            <Icon name={t.err ? 'alert' : 'check-c'} />{t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast() { return useContext(ToastCtx); }

export { fmtDate as formatDate, initials } from '../utils/format';