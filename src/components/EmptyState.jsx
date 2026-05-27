export default function EmptyState() {
  return (
    <div className="empty-state">
      <svg className="empty-state__icon" width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
        {/* Glass envelope body */}
        <rect x="10" y="24" width="76" height="52" rx="8"
          fill="white" fillOpacity="0.07"
          stroke="white" strokeOpacity="0.20" strokeWidth="1.5"/>
        {/* Subtle inner highlight */}
        <rect x="10" y="24" width="76" height="22" rx="8"
          fill="white" fillOpacity="0.06"/>
        {/* Envelope V-fold */}
        <path d="M10 32l38 24 38-24"
          stroke="white" strokeOpacity="0.55" strokeWidth="1.6"
          strokeLinecap="round"/>
        {/* Success badge — glass green */}
        <circle cx="70" cy="68" r="18"
          fill="rgba(50,215,75,0.16)"
          stroke="rgba(50,215,75,0.45)" strokeWidth="1.5"/>
        {/* Inner glow ring */}
        <circle cx="70" cy="68" r="18"
          fill="none"
          stroke="rgba(124,240,151,0.15)" strokeWidth="4"/>
        {/* Checkmark */}
        <polyline
          points="62 68 67.5 74 79 60"
          stroke="#7cf097"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"/>
      </svg>
      <h2 className="empty-state__title">Your inbox looks clean!</h2>
      <p className="empty-state__body">
        No mailing lists with List‑Unsubscribe headers were found in the
        emails scanned. You&apos;re already in great shape.
      </p>
    </div>
  );
}
