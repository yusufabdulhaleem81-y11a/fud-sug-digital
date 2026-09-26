import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, registerStudent } from '../../services/authService';
import { homeForRole } from '../../lib/routing';
import { useInstitution } from '../../hooks/useInstitution';
import {
  Button,
  Card,
  Field,
  Icon,
  inputClass,
  useToast,
} from '../../components/ui';

const PORTALS = [
  {
    icon: 'user',
    name: 'Student Portal',
    note: 'Reports, complaints, suggestions & tracking',
  },
  {
    icon: 'users',
    name: 'EXCO Portal',
    note: 'Casework, tasks, monthly reports',
  },
  {
    icon: 'shield',
    name: 'President & VP',
    note: 'Oversight, reviews & directives',
  },
  {
    icon: 'shield-c',
    name: 'Administrator',
    note: 'Administrations, officers & settings',
  },
];

export default function Login() {
  const { settings } = useInstitution();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === 'signin') {
        const profile = await signIn(email.trim(), password);

        toast(
          `Welcome, ${profile.full_name.split(' ')[0]} — opening your ${profile.role} portal`,
        );

        navigate(homeForRole(profile.role), { replace: true });
      } else {
        await registerStudent(
          email.trim(),
          password,
          fullName.trim(),
        );

        setNotice(
          'Account created. Check your email to confirm, then sign in.',
        );

        setMode('signin');
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--bg)',
        padding: '40px 16px',
      }}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: 920 }}
      >
        <div className="mb-6 text-center">
          <img
            src={settings.logo_path}
            alt={`${settings.short_name} logo`}
            className="mx-auto mb-3 h-16 w-16 object-contain"
          />

          <h1 className="serif text-3xl font-bold">
            SUG Digital
          </h1>

          <p className="text-sm text-stone-500">
            {settings.institution_name}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="mb-5 flex rounded-lg bg-stone-100 p-1 text-sm font-medium">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setNotice(null);
                  }}
                  className={`flex-1 rounded-md py-2 ${
                    mode === m
                      ? 'bg-white shadow text-fud'
                      : 'text-stone-500'
                  }`}
                >
                  {m === 'signin'
                    ? 'Sign in'
                    : 'Student sign up'}
                </button>
              ))}
            </div>

            <form
              onSubmit={onSubmit}
              className="space-y-4"
            >
              {mode === 'signup' && (
                <Field label="Full name">
                  <input
                    className={inputClass}
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    required
                    minLength={3}
                    placeholder="Your full name"
                  />
                </Field>
              )}

              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </Field>

              {/* FORGOT PASSWORD */}
              {mode === 'signin' && (
                <div className="text-right">
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm font-medium text-fud hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {error && (
                <p className="form-err">
                  {error}
                </p>
              )}

              {notice && (
                <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  {notice}
                </p>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="w-full"
              >
                {busy
                  ? 'Please wait…'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create student account'}
              </Button>
            </form>

            <p
              className="mt-4 rounded-lg p-3 text-center text-xs"
              style={{
                background: 'var(--green-soft)',
                color: 'var(--green-2)',
                fontWeight: 600,
              }}
            >
              All roles sign in here — students, EXCO,
              VP, President & administrators.
              The system takes you to your portal
              automatically.
            </p>
          </Card>

          <div>
            <p className="overline mb-3">
              One platform · Five portals
            </p>

            <div className="grid gap-3">
              {PORTALS.map((p) => (
                <Card
                  key={p.name}
                  className="fx p-4"
                >
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      background: 'var(--green-soft)',
                      color: 'var(--green)',
                      display: 'grid',
                      placeItems: 'center',
                      flex: 'none',
                    }}
                  >
                    <Icon
                      name={p.icon}
                      className="ic-lg"
                    />
                  </span>

                  <div>
                    <p style={{ fontWeight: 600 }}>
                      {p.name}
                    </p>

                    <p className="fine">
                      {p.note}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <p className="mt-4 text-center text-sm">
              <Link
                to="/"
                className="text-fud hover:underline"
              >
                ← Back to SUG Digital
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}