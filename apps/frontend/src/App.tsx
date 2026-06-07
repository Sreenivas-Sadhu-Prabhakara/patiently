import { useCallback, useEffect, useState } from 'react';
import type { CreateWishInput, WishView } from '@patiently/shared';
import { api } from './api/client.js';
import { Login } from './components/Login.js';
import { WishCard } from './components/WishCard.js';
import { WishForm } from './components/WishForm.js';

export function App(): JSX.Element {
  const [authed, setAuthed] = useState(api.isAuthenticated);
  const [wishes, setWishes] = useState<WishView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setWishes(await api.listWishes());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) void refresh();
  }, [authed, refresh]);

  const handleCreate = async (input: CreateWishInput): Promise<void> => {
    await api.createWish(input);
    setShowForm(false);
    await refresh();
  };

  const handleSearchNow = async (id: string): Promise<void> => {
    await api.searchNow(id);
    await refresh();
  };

  const handleDecide = async (id: string, approve: boolean): Promise<void> => {
    await api.decide(id, { approve });
    await refresh();
  };

  const handleCancel = async (id: string): Promise<void> => {
    await api.cancelWish(id);
    await refresh();
  };

  const logout = (): void => {
    api.logout();
    setWishes([]);
    setAuthed(false);
  };

  if (!authed) return <Login onLoggedIn={() => setAuthed(true)} />;

  const active = wishes.filter((w) => w.wish.status !== 'cancelled');
  const awaiting = active.filter((w) => w.wish.status === 'awaiting_approval').length;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">◷</span>
          <span className="brand-name">Patiently</span>
        </div>
        <button className="btn btn-link" onClick={logout}>
          Sign out
        </button>
      </header>

      <main className="app-main">
        <div className="summary">
          <p className="summary-line">
            {active.length} item{active.length === 1 ? '' : 's'} on the hunt
            {awaiting > 0 && <span className="summary-pill">{awaiting} ready to buy</span>}
          </p>
        </div>

        {error && <p className="error banner">{error}</p>}

        {showForm ? (
          <WishForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        ) : (
          <button className="btn btn-primary btn-block" onClick={() => setShowForm(true)}>
            + Add something you want
          </button>
        )}

        {loading && wishes.length === 0 ? (
          <p className="muted center">Loading…</p>
        ) : active.length === 0 && !showForm ? (
          <div className="empty">
            <p className="empty-title">Nothing on the hunt yet.</p>
            <p className="muted">
              Add something you want in the next 3–6 months. We&apos;ll quietly track the price
              across stores and ping you when it&apos;s the right time to buy.
            </p>
          </div>
        ) : (
          <section className="wish-list">
            {active.map((view) => (
              <WishCard
                key={view.wish.id}
                view={view}
                onSearchNow={handleSearchNow}
                onDecide={handleDecide}
                onCancel={handleCancel}
              />
            ))}
          </section>
        )}
      </main>

      <footer className="app-footer">
        <span>
          Prices are landed cost — incl. shipping &amp; GST. We never buy without your approval.
        </span>
      </footer>
    </div>
  );
}
