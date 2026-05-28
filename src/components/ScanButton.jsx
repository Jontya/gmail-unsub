export default function ScanButton({ onClick, loading, disabled, progress }) {
  return (
    <button
      className={`scan-btn${loading ? ' scan-btn--loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
    >
      {loading ? (
        <span className="scan-btn__loading">
          <span className="dot-pulse">
            <span /><span /><span />
          </span>
          {progress
            ? `Scanning… ${progress.fetched} / ${progress.total}`
            : 'Scanning your inbox…'}
        </span>
      ) : (
        'Scan My Inbox'
      )}
    </button>
  );
}
