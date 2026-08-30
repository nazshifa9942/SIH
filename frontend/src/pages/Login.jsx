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
    return <Navigate to="/" replace />;
  }

  const from = location.state?.from?.pathname || '/';

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-brand-background)] p-4 relative overflow-hidden">
      {/* Subtle background grid effect */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
            <Anchor className="h-10 w-10 text-white/80" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-white uppercase">
            SIH26006
          </h1>
          <p className="text-[10px] text-[var(--color-brand-text-secondary)] uppercase tracking-[0.3em] mt-2">
            Freight Command Center
          </p>
        </div>

        <div className="bg-[var(--color-brand-elevated)] rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-[11px] rounded-xl bg-[var(--color-status-error)]/10 text-[var(--color-status-error)] border border-[var(--color-status-error)]/20 text-center">
                {error}
              </div>
            )}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full h-12 rounded-xl border border-white/5 bg-black/30 px-4 text-sm text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-white/20"
                placeholder="user@sih26006.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full h-12 rounded-xl border border-white/5 bg-black/30 px-4 text-sm text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-white/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-12 mt-2" disabled={isLoading}>
              {isLoading ? 'AUTHENTICATING...' : 'SIGN IN'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[var(--color-brand-text-secondary)]/50 tracking-widest uppercase mt-8">
          Enter any credentials to preview UI
        </p>
      </div>
    </div>
  );
};
