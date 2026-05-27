import { useState, useCallback } from 'react';

import Header from './components/Header';
import ApiKeyInput from './components/ApiKeyInput';
import ScanButton from './components/ScanButton';
import ResultsHeader from './components/ResultsHeader';
import MailingListCard from './components/MailingListCard';
import UnsubscribeBar from './components/UnsubscribeBar';
import EmptyState from './components/EmptyState';
import Toast from './components/Toast';

import { scanInbox } from './hooks/useGmailScanner';
import { unsubscribeOne } from './hooks/useUnsubscriber';

import './styles/global.css';
import './styles/components.css';

const INITIAL_STATE = {
  apiKey: '',
  phase: 'idle',   // 'idle' | 'scanning' | 'results' | 'unsubscribing' | 'done'
  lists: [],
  toast: null,
  keyError: '',
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  const showToast = useCallback((message) => {
    setState((s) => ({ ...s, toast: { visible: true, message } }));
  }, []);

  const dismissToast = useCallback(() => {
    setState((s) => ({ ...s, toast: null }));
  }, []);

  // ── Scan ────────────────────────────────────────────────────────────────────
  async function handleScan() {
    const { apiKey } = state;
    if (!apiKey.trim()) {
      update({ keyError: 'Please enter your Anthropic API key.' });
      return;
    }
    if (!apiKey.trim().startsWith('sk-')) {
      update({ keyError: 'API key should start with "sk-".' });
      return;
    }
    update({ keyError: '', phase: 'scanning' });

    try {
      const lists = await scanInbox(apiKey.trim());
      update({ phase: 'results', lists });
    } catch (err) {
      update({ phase: 'idle' });
      const msg = err.message || 'Unknown error';
      if (
        msg.toLowerCase().includes('api_key') ||
        msg.toLowerCase().includes('authentication') ||
        msg.toLowerCase().includes('invalid x-api-key')
      ) {
        update({ keyError: 'Invalid API key. Please check and try again.' });
      } else {
        showToast(`Scan failed: ${msg}`);
      }
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

    // Mark all selected as processing
    setState((s) => ({
      ...s,
      lists: s.lists.map((item) =>
        item.checked && item.status === 'pending'
          ? { ...item, status: 'processing' }
          : item
      ),
    }));

    // Sequential processing
    for (const item of selected) {
      try {
        const result = await unsubscribeOne(state.apiKey.trim(), item);
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

    update({ phase: 'done' });
  }

  // ── Restart ─────────────────────────────────────────────────────────────────
  function handleRestart() {
    setState({ ...INITIAL_STATE });
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const { apiKey, phase, lists, toast, keyError } = state;
  const pendingLists = lists.filter((l) => l.status === 'pending');
  const checkedCount = pendingLists.filter((l) => l.checked).length;
  const allChecked   = pendingLists.length > 0 && pendingLists.every((l) => l.checked);
  const successCount = lists.filter((l) => l.status === 'success').length;
  const failCount    = lists.filter((l) => l.status === 'failed').length;

  const isScanning      = phase === 'scanning';
  const isUnsubscribing = phase === 'unsubscribing';
  const showResults     = phase === 'results' || phase === 'unsubscribing' || phase === 'done';

  return (
    <div className="app-layout">
      <Header />

      {/* Step 1 – API key */}
      <ApiKeyInput
        value={apiKey}
        onChange={(v) => update({ apiKey: v, keyError: '' })}
        error={keyError}
        disabled={isScanning || isUnsubscribing}
      />

      {/* Step 2 – Scan button */}
      <ScanButton
        onClick={handleScan}
        loading={isScanning}
        disabled={!apiKey.trim() || isUnsubscribing || showResults}
      />

      {phase === 'idle' && (
        <p className="scan-hint">
          You&apos;ll be asked to connect Gmail via Google OAuth when the MCP server initialises
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
                disabled={isUnsubscribing || phase === 'done'}
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
