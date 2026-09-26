import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useInstitution } from '../../hooks/useInstitution';
import {
  Button,
  Card,
  Field,
  inputClass,
} from '../../components/ui';

export default function ResetPassword() {
  const { settings } = useInstitution();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setError(
          'This password reset link is invalid or has expired. Please request a new one.',
        );
        return;
      }

      setReady(true);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setNotice(null);

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        throw error;
      }

      setNotice(
        'Password updated successfully. Redirecting to login...',
      );

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err: any) {
      setError(
        err.message ??
          'Unable to update your password.',
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
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Create a new password for your SUG Digital
            account.
          </p>
        </div>

        <Card className="p-6">
          {!ready && !error && (
            <p className="text-center text-sm text-stone-500">
              Verifying reset link...
            </p>
          )}

          {ready && (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Field label="New password">
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  minLength={8}
                  placeholder="Enter new password"
                />
              </Field>

              <Field label="Confirm password">
                <input
                  type="password"
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value,
                    )
                  }
                  required
                  minLength={8}
                  placeholder="Confirm new password"
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
                  ? 'Updating...'
                  : 'Update Password'}
              </Button>
            </form>
          )}

          {error && !ready && (
            <div className="mt-5 text-center">
              <Link
                to="/auth/forgot-password"
                className="text-sm text-fud hover:underline"
              >
                Request a new reset link
              </Link>
            </div>
          )}

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