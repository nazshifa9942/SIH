import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Anchor } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login: setAuth, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await login(email, password);
      if (data.token && data.user) {
        setAuth(data.token, data.user);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-brand-background)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--color-gov-navy)]">
            <div className="tricolor-rule absolute bottom-0 left-0 right-0 rounded-b-lg" />
            <Anchor className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-brand-text-muted)]">
            Government of India
          </div>
          <h1 className="mt-1 text-base font-semibold text-[var(--color-brand-text-primary)]">
            Ministry of Ports, Shipping &amp; Waterways
          </h1>
          <p className="mt-0.5 text-xs text-[var(--color-brand-text-muted)]">
            Maritime Command Portal — SIH26006
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-brand-border)] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
            {error && (
              <div
                role="alert"
                className="rounded-md border border-[#fecdca] bg-[var(--color-status-error-bg)] px-3 py-2 text-[13px] text-[var(--color-status-error)]"
              >
                {error}
              </div>
            )}
            <div>
              <label className="ui-label" htmlFor="email">
                Official email ID
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="ui-input"
                placeholder="name@gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="ui-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="ui-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" variant="default" className="w-full" loading={isLoading} disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--color-brand-text-muted)]">
          Authorized government personnel access only
        </p>
      </div>
    </div>
  );
};
