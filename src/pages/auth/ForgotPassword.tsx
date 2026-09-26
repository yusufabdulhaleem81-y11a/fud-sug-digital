import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useInstitution } from '../../hooks/useInstitution';
import { Button, Card, Field, Input } from '../../components/ui';

export default function ForgotPassword() {
  const { settings } = useInstitution();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://fud-sug-digital.netlify.app/auth/reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Could not send the reset email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src={settings.logo_path} alt={`${settings.short_name} logo`}
            className="mx-auto mb-3 h-16 w-16 object-contain" />
          <h1 className="serif text-3xl font-bold">Forgot Password</h1>
          <p className="mt-2 text-sm text-stone-500">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <Card className="p-6">
          {sent ? (
            <div>
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                If an account exists for <b>{email}</b>, a reset link is on its way.
                Please check your inbox — and your <b>spam folder</b>.
              </p>
              <div className="mt-5 text-center">
                <Link to="/login" className="text-sm text-fud hover:underline">← Back to Sign in</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="form-err">{error}</p>}
              <Field label="Your email">
                <Input type="email" required value={email}
                  placeholder="you@example.com"
                  onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Sending…' : 'Send reset link'}
              </Button>
              <div className="text-center">
                <Link to="/login" className="text-sm text-fud hover:underline">← Back to Sign in</Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}