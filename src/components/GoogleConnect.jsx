import { useState } from 'react';

export default function GoogleConnect({ token, loading, error, gisReady, onConnect, onDisconnect, disabled }) {
  const [clientId, setClientId] = useState(() => localStorage.getItem('googleClientId') ?? '');
  const [showInput, setShowInput] = useState(false);

  if (token) {
    return (
      <div className="google-connect google-connect--connected">
        <span className="google-connect__status">
          {/* Checkmark */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="7" fill="rgba(50,215,75,0.20)" />
            <polyline points="3.5 7 5.8 9.5 10.5 4.5"
              stroke="#32d74b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Gmail connected
        </span>
        <button
          className="google-connect__disconnect"
          onClick={() => { localStorage.removeItem('googleClientId'); onDisconnect(); }}
          type="button"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={`google-connect${disabled ? ' google-connect--disabled' : ''}`}>
      <div className="google-connect__header">
        {/* Google Gmail icon */}
        <svg className="google-connect__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6Z"
            stroke="rgba(255,255,255,0.40)" strokeWidth="1.5"/>
          <path d="M2 6L12 13L22 6" stroke="rgba(255,255,255,0.60)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="google-connect__label">Connect Gmail</span>
        <button
          type="button"
          className="google-connect__help"
          onClick={() => setShowInput((v) => !v)}
          aria-expanded={showInput}
          title="Enter your Google Client ID"
        >
          {showInput ? '↑ Hide' : '↓ Setup'}
        </button>
      </div>

      {showInput && (
        <div className="google-connect__setup">
          <input
            className="google-connect__input"
            type="text"
            placeholder="Google OAuth Client ID  (e.g. 123456...apps.googleusercontent.com)"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={disabled || loading}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="google-connect__hint">
            Create a project at{' '}
            <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">
              console.cloud.google.com
            </a>
            , enable the Gmail API, create an OAuth 2.0 Client ID (Web application),
            and add <code>http://localhost:5173</code> to Authorized JavaScript Origins.
          </p>
        </div>
      )}

      {error && <p className="google-connect__error">{error}</p>}

      <button
        type="button"
        className="google-connect__btn"
        onClick={() => { localStorage.setItem('googleClientId', clientId); onConnect(clientId); }}
        disabled={disabled || loading || !gisReady}
      >
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Connecting…
          </>
        ) : (
          <>
            {/* Google G logo */}
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </>
        )}
      </button>
    </div>
  );
}
