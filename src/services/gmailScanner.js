import { parseFrom, parseUnsubscribeHeader, scoreMessage } from '../utils/emailParsing';
import { isAlreadyUnsubscribed } from './unsubscribeHistory';

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

const RETRY_DELAYS = [500, 1000, 2000];

// Like gmailFetch but retries on 429/503 with exponential backoff, then drops on exhaustion.
async function gmailFetchRetry(path, token) {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const r = await fetch(`${GMAIL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) return r.json();
    if (r.status === 429 || r.status === 503) {
      if (attempt < RETRY_DELAYS.length) {
        await new Promise((res) => setTimeout(res, RETRY_DELAYS[attempt]));
        continue;
      }
      return null; // retries exhausted — drop this message
    }
    const body = await r.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Gmail API error ${r.status}`);
  }
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
        gmailFetchRetry(`/messages/${id}?${params}`, token).catch(() => null)
      )
    );
    results.push(...details.filter(Boolean));
    onProgress(results.length, messageIds.length);
  }
  return results;
}

const CATEGORY_KEYS = ['primary', 'promotions', 'social', 'updates'];

function buildQuery(categories) {
  const selected = CATEGORY_KEYS.filter((k) => categories[k]);
  // All (or none) selected → search entire inbox with no category restriction
  if (selected.length === 0 || selected.length === CATEGORY_KEYS.length) {
    return 'in:inbox';
  }
  if (selected.length === 1) {
    return `category:${selected[0]}`;
  }
  // Gmail OR syntax: {term1 term2}
  return `{${selected.map((k) => `category:${k}`).join(' ')}}`;
}

export async function scanInbox(
  googleToken,
  emailCount = 100,
  categories = { primary: true, promotions: true, social: true, updates: true },
  onProgress = () => {},
  showPreviouslyUnsubscribed = false
) {
  const q = buildQuery(categories);

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

  const items = [];
  for (const item of domainMap.values()) {
    if (isAlreadyUnsubscribed(item.domain)) {
      if (showPreviouslyUnsubscribed) items.push({ ...item, previouslyUnsubscribed: true });
    } else {
      items.push(item);
    }
  }
  return items;
}

// For each successfully unsubscribed item, search for emails from that sender
// domain received after the unsubscribe timestamp.
export async function verifyUnsubscribes(token, items) {
  return Promise.all(
    items.map(async (item) => {
      const afterSecs = Math.floor(item.unsubscribedAt / 1000);
      const q = `from:@${item.domain} after:${afterSecs}`;
      try {
        const data = await gmailFetch(
          `/messages?${new URLSearchParams({ q, maxResults: 10 })}`,
          token
        );
        return {
          id: item.id,
          senderName: item.senderName,
          domain: item.domain,
          count: (data.messages || []).length,
        };
      } catch {
        return { id: item.id, senderName: item.senderName, domain: item.domain, count: null };
      }
    })
  );
}
