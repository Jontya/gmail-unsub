export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__title-row">
        <svg className="app-header__icon" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#0071e3" />
          <path d="M6 10.5C6 9.67 6.67 9 7.5 9h17c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-17C6.67 23 6 22.33 6 21.5v-11z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.2" />
          <path d="M6 10.5L16 17l10-6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="app-header__title">Unsubscriber</h1>
      </div>
      <p className="app-header__subtitle">Clean up your inbox in seconds</p>
    </header>
  );
}
