// Colors tuned for dark liquid-glass background
const CATEGORIES = [
  {
    key: 'primary',
    label: 'Primary',
    color: 'rgba(90,171,255,1)',
    borderColor: 'rgba(61,158,255,0.55)',
    bg: 'rgba(61,158,255,0.18)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    key: 'promotions',
    label: 'Promotions',
    color: 'rgba(255,200,80,1)',
    borderColor: 'rgba(255,160,0,0.55)',
    bg: 'rgba(255,149,0,0.18)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    key: 'social',
    label: 'Social',
    color: 'rgba(140,230,160,1)',
    borderColor: 'rgba(50,215,75,0.55)',
    bg: 'rgba(50,215,75,0.18)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'updates',
    label: 'Updates',
    color: 'rgba(210,175,255,1)',
    borderColor: 'rgba(175,100,255,0.55)',
    bg: 'rgba(175,100,255,0.18)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

export default function ScanOptions({ emailCount, onEmailCountChange, categories, onCategoryToggle,
                                      showPreviouslyUnsubscribed, onShowPreviouslyUnsubscribedChange, disabled }) {
  const min = 50;
  const max = 1000;
  const fillPct = ((emailCount - min) / (max - min)) * 100;

  return (
    <div className={`scan-options${disabled ? ' scan-options--disabled' : ''}`}>

      {/* ── Slider ── */}
      <div className="scan-options__group">
        <div className="scan-options__row">
          <span className="scan-options__label">Emails to scan</span>
          <span className="scan-options__value">{emailCount.toLocaleString()}</span>
        </div>
        <div className="slider-wrap">
          <span className="slider-edge">50</span>
          <input
            className="slider"
            type="range"
            min={min}
            max={max}
            step={50}
            value={emailCount}
            onChange={(e) => onEmailCountChange(Number(e.target.value))}
            disabled={disabled}
            style={{ '--fill': `${fillPct}%` }}
            aria-label="Number of emails to scan"
          />
          <span className="slider-edge">1,000</span>
        </div>
      </div>

      <div className="scan-options__divider" />

      {/* ── Category chips ── */}
      <div className="scan-options__group">
        <span className="scan-options__label">Inboxes to include</span>
        <div className="category-chips">
          {CATEGORIES.map(({ key, label, color, borderColor, bg, icon }) => {
            const on = categories[key];
            return (
              <button
                key={key}
                type="button"
                className={`cat-chip${on ? ' cat-chip--on' : ''}`}
                style={on ? { background: bg, borderColor, color } : {}}
                onClick={() => !disabled && onCategoryToggle(key)}
                disabled={disabled}
                aria-pressed={on}
              >
                <span className="cat-chip__icon" style={on ? { color } : {}}>
                  {icon}
                </span>
                {label}
                {on && (
                  <span className="cat-chip__check" style={{ background: borderColor }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <polyline points="1.5 5 4 7.5 8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {Object.values(categories).every((v) => !v) && (
          <p className="scan-options__warn">Select at least one inbox to scan.</p>
        )}
      </div>

      <div className="scan-options__divider" />

      <div className="scan-options__group scan-options__group--row">
        <span className="scan-options__label">Show previously unsubscribed</span>
        <button
          type="button"
          role="switch"
          aria-checked={showPreviouslyUnsubscribed}
          className={`toggle${showPreviouslyUnsubscribed ? ' toggle--on' : ''}`}
          onClick={() => !disabled && onShowPreviouslyUnsubscribedChange(!showPreviouslyUnsubscribed)}
          disabled={disabled}
        >
          <span className="toggle__knob" />
        </button>
      </div>

    </div>
  );
}
