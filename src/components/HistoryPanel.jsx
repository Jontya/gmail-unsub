import { useState } from 'react';
import { loadHistory, clearHistory } from '../services/unsubscribeHistory';

const METHOD_LABEL = { email: 'Email', url: 'URL' };

export default function HistoryPanel({ onClose }) {
  const [history, setHistory] = useState(() =>
    loadHistory()
      .slice()
      .sort((a, b) => new Date(b.unsubscribedAt) - new Date(a.unsubscribedAt))
  );

  function handleClear() {
    clearHistory();
    setHistory([]);
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="history-overlay" onClick={handleBackdrop}>
      <div className="history-panel" role="dialog" aria-modal="true" aria-label="Unsubscribe History">
        <div className="history-panel__header">
          <h2 className="history-panel__title">Unsubscribe History</h2>
          <button
            type="button"
            className="history-panel__close"
            onClick={onClose}
            aria-label="Close history"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {history.length === 0 ? (
          <p className="history-panel__empty">No unsubscribes recorded yet.</p>
        ) : (
          <ul className="history-list">
            {history.map((item, i) => (
              <li key={i} className="history-list__item">
                <div className="history-list__name">{item.senderName}</div>
                <div className="history-list__meta">
                  <span className="history-list__domain">{item.domain}</span>
                  <span className="history-list__method">
                    {METHOD_LABEL[item.unsubscribeMethod] ?? item.unsubscribeMethod}
                  </span>
                  <span className="history-list__date">
                    {new Date(item.unsubscribedAt).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {history.length > 0 && (
          <div className="history-panel__footer">
            <button type="button" className="history-panel__clear" onClick={handleClear}>
              Clear history
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
