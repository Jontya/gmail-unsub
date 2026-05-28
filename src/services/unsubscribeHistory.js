const KEY = 'unsub_history';

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveToHistory(listItem) {
  const history = loadHistory();
  history.push({
    domain:            listItem.domain,
    senderName:        listItem.senderName,
    senderEmail:       listItem.senderEmail,
    unsubscribeMethod: listItem.unsubscribeMethod,
    unsubscribedAt:    new Date().toISOString(),
    status:            'success',
  });
  localStorage.setItem(KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}

export function isAlreadyUnsubscribed(domain) {
  return loadHistory().some((r) => r.domain === domain && r.status === 'success');
}
