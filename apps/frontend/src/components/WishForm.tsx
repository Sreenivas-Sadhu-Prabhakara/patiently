import { useState, type FormEvent } from 'react';
import type { CreateWishInput, ItemCondition, StoreId } from '@patiently/shared';
import { storeLabel } from '../format.js';

const STORES: StoreId[] = [
  'amazon_in',
  'flipkart',
  'croma',
  'reliance_digital',
  'tata_cliq',
  'myntra',
];
const CONDITIONS: ItemCondition[] = ['new', 'used', 'refurbished', 'any'];

function horizonToISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

/** Capture a new wish: the "what I want in 3–6 months" intent. */
export function WishForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: CreateWishInput) => Promise<void>;
  onCancel: () => void;
}): JSX.Element {
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [budget, setBudget] = useState('');
  const [months, setMonths] = useState(4);
  const [condition, setCondition] = useState<ItemCondition>('new');
  const [stores, setStores] = useState<StoreId[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleStore = (s: StoreId): void =>
    setStores((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const input: CreateWishInput = {
        title: title.trim(),
        desiredByDate: horizonToISO(months),
        condition,
        allowedStores: stores,
        ...(brand.trim() ? { brand: brand.trim() } : {}),
        ...(budget ? { maxBudgetCents: Math.round(Number(budget) * 100) } : {}),
      };
      await onSubmit(input);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="form wish-form">
      <h2>What do you want?</h2>
      <label className="field">
        <span>Item</span>
        <input
          type="text"
          placeholder="e.g. Sony WH-1000XM5 headphones"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={2}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Brand (optional)</span>
          <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </label>
        <label className="field">
          <span>Max budget (shipped)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="299.00"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>I want it within</span>
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {[3, 4, 5, 6].map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Condition</span>
          <select value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition)}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field">
        <span>Buy from (leave empty for all stores)</span>
        <div className="chips">
          {STORES.map((s) => (
            <button
              type="button"
              key={s}
              className={`chip ${stores.includes(s) ? 'chip-on' : ''}`}
              onClick={() => toggleStore(s)}
            >
              {storeLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Start hunting'}
        </button>
      </div>
    </form>
  );
}
