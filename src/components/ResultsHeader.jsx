export default function ResultsHeader({ count, allSelected, onSelectAll }) {
  return (
    <div className="results-header">
      <div className="results-header__inner">
        <h2 className="results-header__title">
          Found <span className="results-header__count">{count}</span>{' '}
          {count === 1 ? 'mailing list' : 'mailing lists'}
        </h2>
        <button
          className="results-header__select-all"
          onClick={onSelectAll}
          type="button"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="results-header__divider" />
    </div>
  );
}
