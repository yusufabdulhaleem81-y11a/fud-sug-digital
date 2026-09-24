import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, registerStudent } from '../../services/authService';
import { homeForRole } from '../../lib/routing';
import { useInstitution } from '../../hooks/useInstitution';
import { Button, Card, Field, inputClass } from '../../components/ui';

export default function Login() {
  const { settings } = useInstitution();
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
    setBusy(true); setError(null); setNotice(null);
    try {
      if (mode === 'signin') {
        const profile = await signIn(email.trim(), password);
        navigate(homeForRole(profile.role), { replace: true });
      } else {
        await registerStudent(email.trim(), password, fullName.trim());
        setNotice('Account created. Check your email to confirm, then sign in.');
        setMode('signin');
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F4EE] p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src={settings.logo_path} alt={`${settings.short_name} logo`} className="mx-auto mb-3 h-16 w-16 object-contain" />
          <h1 className="serif text-2xl font-bold">SUG Digital</h1>
          <p className="text-sm text-stone-500">{settings.institution_name}</p>
        </div>
        <Card className="p-6">
          <div className="mb-5 flex rounded-lg bg-stone-100 p-1 text-sm font-medium">
            {(['signin', 'signup'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 rounded-md py-2 ${mode === m ? 'bg-white shadow text-fud' : 'text-stone-500'}`}>
                {m === 'signin' ? 'Sign in' : 'Student sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Field label="Full name">
                <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)}
                  required minLength={3} placeholder="Your full name" />
              </Field>
            )}
            <Field label="Email">
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} placeholder="••••••••" />
            </Field>

            {error && <p className="form-err">{error}</p>}
            {notice && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create student account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-stone-400">
            Students, EXCO, VP, President and administrators all sign in here — you'll be routed to the right portal.
          </p>
        </Card>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-fud hover:underline">← Back to SUG Digital</Link>
        </p>
      </div>
    </div>
  );
}