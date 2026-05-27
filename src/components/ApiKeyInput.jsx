import { useState } from 'react';

export default function ApiKeyInput({ value, onChange, error, disabled }) {
  const [show, setShow] = useState(false);

  return (
    <div className="api-key-section">
      <label className="api-key-label" htmlFor="api-key">
        Anthropic API Key
      </label>
      <div className="api-key-wrapper">
        <input
          id="api-key"
          className={`api-key-input${error ? ' api-key-input--error' : ''}`}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          aria-describedby="api-key-hint"
        />
        <button
          type="button"
          className="api-key-toggle"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide API key' : 'Show API key'}
          tabIndex={0}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="api-key-error">{error}</p>}
      <p id="api-key-hint" className="api-key-hint">
        Your key is never stored or sent anywhere except directly to Anthropic's API
      </p>
    </div>
  );
}
