import { useState, useCallback } from 'react';

import Header from './components/Header';
import GoogleConnect from './components/GoogleConnect';
import ScanOptions from './components/ScanOptions';
import ScanButton from './components/ScanButton';
import ResultsHeader from './components/ResultsHeader';
import MailingListCard from './components/MailingListCard';
import UnsubscribeBar from './components/UnsubscribeBar';
import EmptyState from './components/EmptyState';
import Toast from './components/Toast';

import { scanInbox, verifyUnsubscribes } from './services/gmailScanner';
import { unsubscribeOne, fetchProfileEmail } from './services/unsubscriber';
import { useGoogleAuth } from './hooks/useGoogleAuth';

import './styles/global.css';
import './styles/components.css';

const INITIAL_STATE = {
  phase: 'idle',   // 'idle' | 'scanning' | 'results' | 'unsubscribing' | 'done'
  lists: [],
  toast: null,
  emailCount: 100,
  categories: { primary: true, promotions: true, social: true, updates: true },
  scanProgress: null,              // { fetched, total } while scanning, null otherwise
  verification: null,              // null | { status: 'verifying'|'done', results: [] }
  showPreviouslyUnsubscribed: false,
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const { token: googleToken, tokenExpiry, loading: googleLoading, error: googleError,
          gisReady, connect: connectGoogle, disconnect: disconnectGoogle } = useGoogleAuth();

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  const showToast = useCallback((message) => {
    setState((s) => ({ ...s, toast: { visible: true, message } }));
  }, []);

  const dismissToast = useCallback(() => {
    setState((s) => ({ ...s, toast: null }));
  }, []);

  // ── Token expiry guard ───────────────────────────────────────────────────────
  function tokenNearExpiry() {
    if (!tokenExpiry) return false;
    return Date.now() > tokenExpiry - 2 * 60 * 1000;
  }

  function guardToken() {
    if (!tokenNearExpiry()) return false;
    disconnectGoogle();
    showToast('Session expired — please reconnect your Google account.');
    return true;
  }

  // ── Scan ────────────────────────────────────────────────────────────────────
  async function handleScan() {
    if (guardToken()) return;
    update({ phase: 'scanning', scanProgress: null });
    try {
      const lists = await scanInbox(
        googleToken,
        state.emailCount,
        state.categories,
        (fetched, total) => update({ scanProgress: { fetched, total } }),
        state.showPreviouslyUnsubscribed
      );
      update({ phase: 'results', lists, scanProgress: null });
    } catch (err) {
      update({ phase: 'idle', scanProgress: null });
      const msg = err.message || 'Unknown error';
      showToast(`Scan failed: ${msg}`);
    }
  }

  // ── Toggle card ─────────────────────────────────────────────────────────────
  function toggleCard(id) {
    setState((s) => ({
      ...s,
      lists: s.lists.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
  }

  // ── Select all ──────────────────────────────────────────────────────────────
  function handleSelectAll() {
    const pending = state.lists.filter((l) => l.status === 'pending');
    const allChecked = pending.length > 0 && pending.every((l) => l.checked);
    setState((s) => ({
      ...s,
      lists: s.lists.map((item) =>
        item.status === 'pending' ? { ...item, checked: !allChecked } : item
      ),
    }));
  }

  // ── Unsubscribe ──────────────────────────────────────────────────────────────
  async function handleUnsubscribe() {
    if (guardToken()) return;
    const selected = state.lists.filter((l) => l.checked && l.status === 'pending');
    if (selected.length === 0) return;

    update({ phase: 'unsubscribing' });

    setState((s) => ({
      ...s,
      lists: s.lists.map((item) =>
        item.checked && item.status === 'pending'
          ? { ...item, status: 'processing' }
          : item
      ),
    }));

    const profileEmail = await fetchProfileEmail(googleToken);

    for (const item of selected) {
      try {
        const result = await unsubscribeOne(googleToken, item, profileEmail);
        setState((s) => ({
          ...s,
          lists: s.lists.map((li) =>
            li.id === item.id
              ? { ...li, status: result.success ? 'success' : 'failed', statusMessage: result.message,
                  ...(result.success && { unsubscribedAt: Date.now() }) }
              : li
          ),
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          lists: s.lists.map((li) =>
            li.id === item.id
              ? { ...li, status: 'failed', statusMessage: err.message || 'Request failed.' }
              : li
          ),
        }));
      }
    }

    // Only go to 'done' when no pending items remain; otherwise stay in 'results'
    // so the user can keep selecting and unsubscribing from remaining lists.
    setState((s) => {
      const hasPending = s.lists.some((l) => l.status === 'pending');
      return { ...s, phase: hasPending ? 'results' : 'done' };
    });
  }

  // ── Restart ─────────────────────────────────────────────────────────────────
  function handleRestart() {
    setState({ ...INITIAL_STATE });
  }

  // ── Scan Again ───────────────────────────────────────────────────────────────
  function handleScanAgain() {
    setState((s) => ({
      ...INITIAL_STATE,
      emailCount: s.emailCount,
      categories: s.categories,
      showPreviouslyUnsubscribed: s.showPreviouslyUnsubscribed,
    }));
  }

  // ── Verify unsubscribes ──────────────────────────────────────────────────────
  async function handleVerify() {
    if (guardToken()) return;
    const successItems = state.lists.filter((l) => l.status === 'success');
    update({ verification: { status: 'verifying', results: [] } });
    try {
      const results = await verifyUnsubscribes(googleToken, successItems);
      update({ verification: { status: 'done', results } });
    } catch (err) {
      update({ verification: null });
      showToast(`Verification failed: ${err.message || 'Unknown error'}`);
    }
  }

  // ── Category toggle ─────────────────────────────────────────────────────────
  function toggleCategory(key) {
    setState((s) => ({
      ...s,
      categories: { ...s.categories, [key]: !s.categories[key] },
    }));
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const { phase, lists, toast, emailCount, categories, scanProgress, verification,
          showPreviouslyUnsubscribed } = state;
  const gmailConnected  = Boolean(googleToken);
  const noCategorySelected = Object.values(categories).every((v) => !v);
  const pendingLists    = lists.filter((l) => l.status === 'pending');
  const checkedCount    = pendingLists.filter((l) => l.checked).length;
  const allChecked      = pendingLists.length > 0 && pendingLists.every((l) => l.checked);
  const successCount    = lists.filter((l) => l.status === 'success').length;
  const failCount       = lists.filter((l) => l.status === 'failed').length;

  const isScanning      = phase === 'scanning';
  const isUnsubscribing = phase === 'unsubscribing';
  const showResults     = phase === 'results' || phase === 'unsubscribing' || phase === 'done';

  return (
    <div className="app-layout">
      <Header />

      {/* Step 1 – Gmail OAuth */}
      <GoogleConnect
        token={googleToken}
        loading={googleLoading}
        error={googleError}
        gisReady={gisReady}
        onConnect={connectGoogle}
        onDisconnect={disconnectGoogle}
        disabled={isScanning || isUnsubscribing}
      />

      {/* Step 2 – Scan options */}
      {!showResults && (
        <ScanOptions
          emailCount={emailCount}
          onEmailCountChange={(v) => update({ emailCount: v })}
          categories={categories}
          onCategoryToggle={toggleCategory}
          showPreviouslyUnsubscribed={showPreviouslyUnsubscribed}
          onShowPreviouslyUnsubscribedChange={(v) => update({ showPreviouslyUnsubscribed: v })}
          disabled={isScanning}
        />
      )}

      {/* Step 3 – Scan / Scan Again */}
      {phase === 'results' ? (
        <button className="scan-btn" onClick={handleScanAgain} type="button">
          Scan Again
        </button>
      ) : (
        <ScanButton
          onClick={handleScan}
          loading={isScanning}
          disabled={!gmailConnected || isUnsubscribing || showResults || noCategorySelected}
          progress={scanProgress}
        />
      )}

      {phase === 'idle' && (
        <p className="scan-hint">
          Connect Gmail above, then scan to find mailing lists in your inbox.
        </p>
      )}

      {/* Empty state */}
      {showResults && lists.length === 0 && !isScanning && (
        <EmptyState />
      )}

      {/* Results list */}
      {showResults && lists.length > 0 && (
        <>
          {phase === 'done' ? (
            <div className="summary">
              <h2 className="summary__title">All done!</h2>
              <p className="summary__sub">Here&apos;s what happened with your selected lists.</p>
              <div className="summary__stats">
                <div className="summary__stat">
                  <span className="summary__stat-number summary__stat-number--success">{successCount}</span>
                  <span className="summary__stat-label">Unsubscribed</span>
                </div>
                <div className="summary__stat">
                  <span className="summary__stat-number summary__stat-number--fail">{failCount}</span>
                  <span className="summary__stat-label">Failed</span>
                </div>
              </div>
              <div className="summary__actions">
                <button className="summary__restart" onClick={handleRestart}>
                  Start Over
                </button>
                {successCount > 0 && !verification && (
                  <button className="summary__verify" onClick={handleVerify}>
                    Verify unsubscribes
                  </button>
                )}
                {verification?.status === 'verifying' && (
                  <span className="summary__verify-loading">Checking for new emails…</span>
                )}
              </div>
            </div>
          ) : (
            <ResultsHeader
              count={lists.length}
              allSelected={allChecked}
              onSelectAll={handleSelectAll}
            />
          )}

          <div className="card-list">
            {lists.map((item, index) => (
              <MailingListCard
                key={item.id}
                item={item}
                index={index}
                onToggle={toggleCard}
                disabled={isUnsubscribing}
              />
            ))}
          </div>

          {phase === 'done' && verification?.status === 'done' && (
            <ul className="verify-results">
              {verification.results.map((r) => (
                <li key={r.id} className="verify-results__item">
                  <span className="verify-results__name">{r.senderName}</span>
                  <span className={`verify-results__status${
                    r.count === null ? '' :
                    r.count === 0   ? ' verify-results__status--ok' :
                                      ' verify-results__status--warn'
                  }`}>
                    {r.count === null
                      ? 'Could not check'
                      : r.count === 0
                      ? 'No new emails — looks good'
                      : `${r.count} new email${r.count !== 1 ? 's' : ''} found`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Sticky action bar */}
      {(phase === 'results' || phase === 'unsubscribing') && (
        <UnsubscribeBar
          selectedCount={checkedCount}
          onUnsubscribe={handleUnsubscribe}
          loading={isUnsubscribing}
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast message={toast.message} onDismiss={dismissToast} />
      )}
    </div>
  );
}
