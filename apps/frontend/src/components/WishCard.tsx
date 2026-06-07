import { useState } from 'react';
import type { WishStatus, WishView } from '@patiently/shared';
import { formatHorizon, formatMoney, storeLabel } from '../format.js';

const STATUS_LABEL: Record<WishStatus, string> = {
  active: 'Hunting',
  awaiting_approval: 'Approve to buy',
  purchasing: 'Buying…',
  purchased: 'Purchased',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export function WishCard({
  view,
  onSearchNow,
  onDecide,
  onCancel,
}: {
  view: WishView;
  onSearchNow: (id: string) => Promise<void>;
  onDecide: (id: string, approve: boolean) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}): JSX.Element {
  const { wish, bestOffer, recentOffers, pendingDecision, savingsVsMedianCents } = view;
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>): Promise<void> => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`card status-${wish.status}`}>
      <header className="card-head">
        <div>
          <h3 className="card-title">{wish.title}</h3>
          <p className="card-sub">
            {formatHorizon(wish.desiredByDate)}
            {wish.maxBudgetCents !== undefined && (
              <> · budget {formatMoney(wish.maxBudgetCents, wish.currency)}</>
            )}
          </p>
        </div>
        <span className={`badge badge-${wish.status}`}>{STATUS_LABEL[wish.status]}</span>
      </header>

      {bestOffer ? (
        <div className="best-offer">
          <div className="best-line">
            <span className="best-label">Best landed price</span>
            <span className="best-price">
              {formatMoney(bestOffer.totalLandedCents, bestOffer.currency)}
            </span>
          </div>
          <p className="best-meta">
            {storeLabel(bestOffer.store)} · item{' '}
            {formatMoney(bestOffer.itemPriceCents, bestOffer.currency)} + shipping{' '}
            {formatMoney(bestOffer.shippingCents, bestOffer.currency)}
            {bestOffer.taxCents > 0 ? (
              <> + tax {formatMoney(bestOffer.taxCents, bestOffer.currency)}</>
            ) : (
              <> · incl. GST</>
            )}
            {bestOffer.discountCents > 0 && (
              <> − {formatMoney(bestOffer.discountCents, bestOffer.currency)} off</>
            )}
          </p>
          {savingsVsMedianCents !== undefined && savingsVsMedianCents > 0 && (
            <p className="savings">
              Saving {formatMoney(savingsVsMedianCents, bestOffer.currency)} vs. the typical price
            </p>
          )}
        </div>
      ) : (
        <p className="muted">No offers captured yet — run a search to populate prices.</p>
      )}

      {recentOffers.length > 1 && (
        <details className="offers">
          <summary>{recentOffers.length} offers compared</summary>
          <ul>
            {recentOffers.slice(0, 5).map((o) => (
              <li key={o.id}>
                <span>{storeLabel(o.store)}</span>
                <a href={o.url} target="_blank" rel="noreferrer">
                  {o.condition}
                </a>
                <span>{formatMoney(o.totalLandedCents, o.currency)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {pendingDecision && wish.status === 'awaiting_approval' && (
        <div className="proposal">
          <p className="proposal-reason">{pendingDecision.reason}</p>
          <div className="proposal-actions">
            <button
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => run(() => onDecide(wish.id, false))}
            >
              Not now
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => run(() => onDecide(wish.id, true))}
            >
              Approve & buy{' '}
              {formatMoney(pendingDecision.totalLandedCents, pendingDecision.currency)}
            </button>
          </div>
        </div>
      )}

      {(wish.status === 'active' || wish.status === 'expired') && (
        <div className="card-actions">
          <button
            className="btn btn-soft"
            disabled={busy}
            onClick={() => run(() => onSearchNow(wish.id))}
          >
            {busy ? 'Checking…' : 'Check price now'}
          </button>
          <button
            className="btn btn-link"
            disabled={busy}
            onClick={() => run(() => onCancel(wish.id))}
          >
            Remove
          </button>
        </div>
      )}

      {wish.status === 'purchased' && bestOffer && (
        <p className="confirmation">
          ✓ Ordered from {storeLabel(bestOffer.store)} ·{' '}
          {formatMoney(bestOffer.totalLandedCents, bestOffer.currency)} shipped
        </p>
      )}
    </article>
  );
}
