import { parseFrom, parseUnsubscribeHeader, scoreMessage } from '../utils/emailParsing';

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';

const METADATA_HEADERS = [
  'List-Unsubscribe',
  'List-Unsubscribe-Post',
  'From',
  'Subject',
  'Precedence',
  'X-Mailer',
  'Return-Path',
];

async function gmailFetch(path, token) {
  const r = await fetch(`${GMAIL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Gmail API error ${r.status}`);
  }
  return r.json();
}

async function fetchMessageIds(token, q, maxCount) {
  const ids = [];
  let pageToken = null;

  while (ids.length < maxCount) {
    const remaining = maxCount - ids.length;
    const params = new URLSearchParams({ q, maxResults: Math.min(remaining, 500) });
    if (pageToken) params.set('pageToken', pageToken);

    const data = await gmailFetch(`/messages?${params}`, token);
    ids.push(...(data.messages || []));
    pageToken = data.nextPageToken;
    if (!pageToken || !data.messages?.length) break;
  }

  return ids.slice(0, maxCount);
}

// Fetch message metadata for the specific headers needed for scoring/parsing
async function fetchMetadataBatch(token, messageIds, onProgress, batchSize = 10) {
  const results = [];
  const params = new URLSearchParams({ format: 'metadata' });
  METADATA_HEADERS.forEach((h) => params.append('metadataHeaders', h));

  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize);
    const details = await Promise.all(
      batch.map(({ id }) =>
        gmailFetch(`/messages/${id}?${params}`, token).catch(() => null)
      )
    );
    results.push(...details.filter(Boolean));
    onProgress(results.length, messageIds.length);
  }
  return results;
}

export async function scanInbox(
  googleToken,
  emailCount = 100,
  categories = { primary: true, promotions: true, social: true, updates: true },
  onProgress = () => {}
) {
  // Always restrict to promotional mail that advertises an unsubscribe mechanism.
  const q = 'category:promotions has:list-unsubscribe';

  console.log('[scan] Gmail query:', q);

  const messageIds = await fetchMessageIds(googleToken, q, emailCount);
  console.log('[scan] messages matched by query:', messageIds.length);

  if (messageIds.length === 0) return [];

  const messages = await fetchMetadataBatch(googleToken, messageIds, onProgress);
  console.log('[scan] metadata fetched for:', messages.length);

  // Parse, filter by List-Unsubscribe header, deduplicate by sender domain
  let withHeader = 0;
  const domainMap = new Map();

  for (const msg of messages) {
    const headers = Object.fromEntries(
      (msg.payload?.headers ?? []).map((h) => [h.name.toLowerCase(), h.value])
    );

    const unsubHeader = headers['list-unsubscribe'];
    if (!unsubHeader) continue;
    withHeader++;

    if (scoreMessage(headers) === 0) continue;

    const { name: senderName, email: senderEmail } = parseFrom(headers['from'] ?? '');
    const domain = senderEmail.includes('@') ? senderEmail.split('@')[1] : senderEmail;
    if (domainMap.has(domain)) continue;

    const { method, value, oneClick } = parseUnsubscribeHeader(
      unsubHeader,
      headers['list-unsubscribe-post'] ?? ''
    );

    domainMap.set(domain, {
      id:                msg.id,
      senderName:        senderName || domain,
      senderEmail,
      domain,
      exampleSubject:    headers['subject'] ?? '(no subject)',
      unsubscribeMethod: method,
      unsubscribeValue:  value,
      oneClick,
      checked:           false,
      status:            'pending',
      statusMessage:     '',
    });
  }

  console.log(
    `[scan] ${withHeader}/${messages.length} emails had List-Unsubscribe → ${domainMap.size} unique senders`
  );

  return [...domainMap.values()];
}
