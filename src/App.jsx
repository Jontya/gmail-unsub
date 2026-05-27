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

import { scanInbox } from './hooks/useGmailScanner';
import { unsubscribeOne } from './hooks/useUnsubscriber';
import { useGoogleAuth } from './hooks/useGoogleAuth';

import './styles/global.css';
import './styles/components.css';

const INITIAL_STATE = {
  phase: 'idle',   // 'idle' | 'scanning' | 'results' | 'unsubscribing' | 'done'
  lists: [],
  toast: null,
  emailCount: 100,
  categories: { primary: true, promotions: true, social: true, updates: true },
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const { token: googleToken, loading: googleLoading, error: googleError,
          gisReady, connect: connectGoogle, disconnect: disconnectGoogle } = useGoogleAuth();

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  const showToast = useCallback((message) => {
    setState((s) => ({ ...s, toast: { visible: true, message } }));
  }, []);

  const dismissToast = useCallback(() => {
    setState((s) => ({ ...s, toast: null }));
  }, []);

  // ── Scan ────────────────────────────────────────────────────────────────────
  async function handleScan() {
    update({ phase: 'scanning' });
    try {
      const lists = await scanInbox(googleToken, state.emailCount, state.categories);
      update({ phase: 'results', lists });
    } catch (err) {
      update({ phase: 'idle' });
      const msg = err.message || 'Unknown error';
      console.error('[scan error]', msg);
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

    for (const item of selected) {
      try {
        const result = await unsubscribeOne(googleToken, item);
        setState((s) => ({
          ...s,
          lists: s.lists.map((li) =>
            li.id === item.id
              ? { ...li, status: result.success ? 'success' : 'failed', statusMessage: result.message }
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

  // ── Category toggle ─────────────────────────────────────────────────────────
  function toggleCategory(key) {
    setState((s) => ({
      ...s,
      categories: { ...s.categories, [key]: !s.categories[key] },
    }));
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const { phase, lists, toast, emailCount, categories } = state;
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
          disabled={isScanning}
        />
      )}

      {/* Step 3 – Scan button */}
      <ScanButton
        onClick={handleScan}
        loading={isScanning}
        disabled={!gmailConnected || isUnsubscribing || showResults || noCategorySelected}
      />

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
              <button className="summary__restart" onClick={handleRestart}>
                Start Over
              </button>
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
