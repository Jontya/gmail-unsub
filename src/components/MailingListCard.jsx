import { avatarColor, avatarInitial } from '../utils/avatarColor';

function MethodBadge({ method }) {
  const map = {
    email: { label: 'Email', cls: 'badge--email' },
    url:   { label: 'URL',   cls: 'badge--url' },
    unknown: { label: 'Unknown', cls: 'badge--unknown' },
  };
  const { label, cls } = map[method] ?? map.unknown;
  return <span className={`method-badge ${cls}`}>{label}</span>;
}

function StatusOverlay({ status, statusMessage }) {
  if (status === 'processing') {
    return (
      <div className="card-status card-status--processing">
        <span className="card-status__spinner" />
        Unsubscribing…
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div className="card-status card-status--success">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {statusMessage || 'Unsubscribed'}
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="card-status card-status--failed">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        {statusMessage || 'Failed'}
      </div>
    );
  }
  return null;
}

export default function MailingListCard({ item, index, onToggle, disabled }) {
  const { senderName, senderEmail, exampleSubject, unsubscribeMethod, checked, status, statusMessage,
          previouslyUnsubscribed } = item;
  const color = avatarColor(senderName);
  const initial = avatarInitial(senderName);
  const isDone = status === 'success' || status === 'failed' || status === 'processing';

  function handleClick() {
    if (!disabled && status === 'pending') onToggle(item.id);
  }

  return (
    <div
      className={`card${checked ? ' card--selected' : ''}${status === 'success' ? ' card--done' : ''}${status === 'processing' ? ' card--processing' : ''}`}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={handleClick}
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleClick(); } }}
    >
      {isDone ? (
        <StatusOverlay status={status} statusMessage={statusMessage} />
      ) : (
        <>
          {/* Left */}
          <div className="card__left">
            <div
              className="card__avatar"
              style={{ background: color.bg, color: color.fg }}
              aria-hidden="true"
            >
              {initial}
            </div>
            <div className="card__info">
              <span className="card__name">{senderName}</span>
              <span className="card__email">{senderEmail}</span>
              {exampleSubject && (
                <span className="card__subject" title={exampleSubject}>{exampleSubject}</span>
              )}
              {previouslyUnsubscribed && (
                <span className="card__prev-badge">Unsubscribed before</span>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="card__right">
            <MethodBadge method={unsubscribeMethod} />
            <span className={`card__checkbox${checked ? ' card__checkbox--checked' : ''}`} aria-hidden="true">
              {checked && (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <polyline points="2 6.5 5.5 10 11 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
