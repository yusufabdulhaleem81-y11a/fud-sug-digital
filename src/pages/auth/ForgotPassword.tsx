import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useInstitution } from '../../hooks/useInstitution';
import {
  Button,
  Card,
  Field,
  inputClass,
} from '../../components/ui';

export default function ForgotPassword() {
  const { settings } = useInstitution();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              `${window.location.origin}/auth/reset-password`,
          },
        );

      if (error) {
        throw error;
      }

      setNotice(
        'If an account exists with that email, a password reset link has been sent. Please check your email.',
      );
    } catch (err: any) {
      setError(
        err.message ??
          'Unable to send password reset email.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img
            src={settings.logo_path}
            alt={`${settings.short_name} logo`}
            className="mx-auto mb-3 h-16 w-16 object-contain"
          />

          <h1 className="serif text-3xl font-bold">
            Forgot Password?
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Enter your email and we'll send you a
            password reset link.
          </p>
        </div>

        <Card className="p-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
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
                ? 'Sending...'
                : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="text-sm text-fud hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}