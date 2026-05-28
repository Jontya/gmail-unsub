import { useState } from 'react';
import HistoryPanel from './HistoryPanel';

export default function Header() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <header className="app-header">
        <div className="app-header__title-row">
          {/* Liquid-glass icon */}
          <svg className="app-header__icon" width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
            <rect width="44" height="44" rx="13" fill="white" fillOpacity="0.10"/>
            <rect width="44" height="44" rx="13" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="1"/>
            <rect x="1" y="1" width="42" height="19" rx="12" fill="white" fillOpacity="0.09"/>
            <rect x="9" y="14" width="26" height="18" rx="3" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="1.6"/>
            <polyline
              points="9,15.5 22,24.5 35,15.5"
              stroke="white"
              strokeOpacity="0.85"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="app-header__title">Unsubscriber</h1>

          <button
            type="button"
            className="app-header__history-btn"
            onClick={() => setShowHistory(true)}
            aria-label="View unsubscribe history"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            History
          </button>
        </div>
        <p className="app-header__subtitle">Clean up your inbox in seconds</p>
      </header>

      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </>
  );
}
