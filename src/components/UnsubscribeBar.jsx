import { useEffect, useState } from 'react';

export default function UnsubscribeBar({ selectedCount, onUnsubscribe, loading }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer so CSS transition fires
    const t = setTimeout(() => setVisible(selectedCount > 0), 0);
    return () => clearTimeout(t);
  }, [selectedCount]);

  if (selectedCount === 0 && !visible) return null;

  return (
    <div className={`unsub-bar${visible && selectedCount > 0 ? ' unsub-bar--visible' : ''}`}>
      <div className="unsub-bar__inner">
        <span className="unsub-bar__count">
          {selectedCount} {selectedCount === 1 ? 'list' : 'lists'} selected
        </span>
        <button
          className={`unsub-bar__btn${loading ? ' unsub-bar__btn--loading' : ''}`}
          onClick={onUnsubscribe}
          disabled={loading || selectedCount === 0}
          type="button"
        >
          {loading ? 'Unsubscribing…' : 'Unsubscribe from Selected'}
        </button>
      </div>
    </div>
  );
}
