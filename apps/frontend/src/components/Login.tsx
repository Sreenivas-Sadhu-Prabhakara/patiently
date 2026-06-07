import { useState, type FormEvent } from 'react';
import { api } from '../api/client.js';

/**
 * Passwordless MVP sign-in. Pre-filled with the seeded demo account so the app
 * is explorable in one tap.
 */
export function Login({ onLoggedIn }: { onLoggedIn: () => void }): JSX.Element {
  const [email, setEmail] = useState('demo@patiently.app');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(email.trim(), name.trim() || undefined);
      onLoggedIn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark">◷</span>
          <span className="brand-name">Patiently</span>
        </div>
        <p className="auth-tagline">
          Tell us what you want over the next 3–6 months. We hunt the cheapest landed price every
          day and buy it the moment you approve.
        </p>
        <form onSubmit={submit} className="form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Name (optional)</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
