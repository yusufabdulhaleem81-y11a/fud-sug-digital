import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function SetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Session check — updateUser() only works if the visitor arrived
  // from a valid invitation link carrying an active session.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setReady(true);
      } else {
        setError(
          'This link is invalid or has expired. Please contact the SUG administrator for your account details.',
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage('Password created successfully. Redirecting to sign in…');

    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-fud">
            Set Your Password
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Welcome to SUG Digital. Create your password to activate your account.
          </p>
        </div>

        {!ready && !error && (
          <p className="text-center text-sm text-gray-500">
            Verifying your invitation link…
          </p>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {error && (
          <div className="mt-5 text-center">
            <Link to="/login" className="text-sm text-fud hover:underline">
              ← Back to Sign in
            </Link>
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                New password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-fud"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Confirm password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-fud"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-fud px-4 py-3 font-semibold text-white hover:bg-fud-dark disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Create Password'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-fud hover:underline">
                ← Back to Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}