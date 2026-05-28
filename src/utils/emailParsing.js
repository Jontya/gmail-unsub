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

const ESP_PATTERN = /mailchimp|sendgrid|klaviyo|hubspot|constant contact|braze|iterable/i;

/**
 * Score a message's marketing signals. Returns 0 if no signals match,
 * which means the message should be discarded before deduplication.
 */
export function scoreMessage(headers) {
  let score = 0;

  if ((headers['list-unsubscribe-post'] ?? '').includes('One-Click')) score++;

  const precedence = (headers['precedence'] ?? '').toLowerCase();
  if (precedence === 'bulk' || precedence === 'list') score++;

  if (ESP_PATTERN.test(headers['x-mailer'] ?? '')) score++;

  // Compare Return-Path domain vs From domain
  const rpRaw = headers['return-path'] ?? '';
  const rpMatch = rpRaw.match(/<([^>]+)>/);
  const rpEmail = rpMatch ? rpMatch[1].trim() : rpRaw.trim();
  const rpDomain = rpEmail.includes('@') ? rpEmail.split('@')[1].toLowerCase() : '';

  const { email: fromEmail } = parseFrom(headers['from'] ?? '');
  const fromDomain = fromEmail.includes('@') ? fromEmail.split('@')[1].toLowerCase() : '';

  if (rpDomain && fromDomain && rpDomain !== fromDomain) score++;

  return score;
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
