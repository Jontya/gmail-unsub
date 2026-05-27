export default function EmptyState() {
  return (
    <div className="empty-state">
      <svg className="empty-state__icon" width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <rect x="10" y="20" width="60" height="44" rx="6" fill="#e8f0fe" stroke="#c5d8fc" strokeWidth="2" />
        <path d="M10 28l30 19 30-19" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="56" cy="56" r="14" fill="#e6f4ea" stroke="#34a853" strokeWidth="2" />
        <polyline points="50 56 55 61 63 51" stroke="#188038" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2 className="empty-state__title">Your inbox looks clean!</h2>
      <p className="empty-state__body">
        No mailing lists with List-Unsubscribe headers were found in your last 100 emails.
        You&apos;re already in great shape.
      </p>
    </div>
  );
}
