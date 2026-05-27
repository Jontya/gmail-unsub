import { parseFrom, parseUnsubscribeHeader } from '../utils/emailParsing';

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';

const CATEGORY_OPERATORS = {
  primary:    'category:primary',
  promotions: 'category:promotions',
  social:     'category:social',
  updates:    'category:updates',
};

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

// Fetch full message metadata (all headers) in parallel batches
async function fetchMetadataBatch(token, messageIds, batchSize = 10) {
  const results = [];
  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize);
    const details = await Promise.all(
      batch.map(({ id }) =>
        // format=metadata without metadataHeaders restriction returns ALL headers
        gmailFetch(`/messages/${id}?format=metadata`, token).catch(() => null)
      )
    );
    results.push(...details.filter(Boolean));
  }
  return results;
}

export async function scanInbox(
  googleToken,
  emailCount = 100,
  categories = { primary: true, promotions: true, social: true, updates: true }
) {
  const selected = Object.entries(categories).filter(([, on]) => on).map(([k]) => k);
  const allKeys  = Object.keys(CATEGORY_OPERATORS);

  // Build search query using category operators (reliable via API).
  // When all categories selected, search the whole inbox except sent/draft/spam/trash.
  let q;
  if (selected.length === 0 || selected.length === allKeys.length) {
    q = '-in:sent -in:draft -in:spam -in:trash';
  } else {
    q = `(${selected.map((k) => CATEGORY_OPERATORS[k]).join(' OR ')})`;
  }

  console.log('[scan] Gmail query:', q);

  const messageIds = await fetchMessageIds(googleToken, q, emailCount);
  console.log('[scan] messages matched by query:', messageIds.length);

  if (messageIds.length === 0) return [];

  const messages = await fetchMetadataBatch(googleToken, messageIds);
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

    const { name: senderName, email: senderEmail } = parseFrom(headers['from'] ?? '');
    const domain = senderEmail.includes('@') ? senderEmail.split('@')[1] : senderEmail;
    if (domainMap.has(domain)) continue;

    const { method, value } = parseUnsubscribeHeader(unsubHeader);

    domainMap.set(domain, {
      id:                msg.id,
      senderName:        senderName || domain,
      senderEmail,
      domain,
      exampleSubject:    headers['subject'] ?? '(no subject)',
      unsubscribeMethod: method,
      unsubscribeValue:  value,
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
