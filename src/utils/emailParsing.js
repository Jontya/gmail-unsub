/**
 * Parse a raw RFC 5322 From header into { name, email }.
 * Handles: "Display Name" <email>, <email>, email
 */
export function parseFrom(from = '') {
  const withBrackets = from.match(/^"?([^"<]*?)"?\s*<([^>]+)>/);
  if (withBrackets) {
    return {
      name:  withBrackets[1].trim() || withBrackets[2].trim(),
      email: withBrackets[2].trim(),
    };
  }
  const bare = from.trim();
  return { name: bare, email: bare };
}

/**
 * Parse a List-Unsubscribe header value into { method, value }.
 * Header can contain: <mailto:unsub@example.com>, <https://example.com/unsub>
 * Prefers email method over URL.
 */
export function parseUnsubscribeHeader(value = '') {
  const parts = [...value.matchAll(/<([^>]+)>/g)].map((m) => m[1].trim());

  for (const p of parts) {
    if (p.toLowerCase().startsWith('mailto:')) {
      return { method: 'email', value: p.slice(7).trim() };
    }
  }
  for (const p of parts) {
    if (p.startsWith('http')) {
      return { method: 'url', value: p };
    }
  }
  return { method: 'unknown', value: value.trim() };
}
