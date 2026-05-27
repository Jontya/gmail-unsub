export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__title-row">
        {/* Liquid-glass icon */}
        <svg className="app-header__icon" width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
          {/* Glass background */}
          <rect width="44" height="44" rx="13" fill="white" fillOpacity="0.10"/>
          <rect width="44" height="44" rx="13" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="1"/>
          {/* Top specular sheen */}
          <rect x="1" y="1" width="42" height="19" rx="12" fill="white" fillOpacity="0.09"/>
          {/* Envelope body */}
          <rect x="9" y="14" width="26" height="18" rx="3" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="1.6"/>
          {/* Envelope V-fold */}
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
      </div>
      <p className="app-header__subtitle">Clean up your inbox in seconds</p>
    </header>
  );
}
