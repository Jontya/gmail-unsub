import { parseClaudeJSON } from '../utils/parseResponse';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MCP_SERVER = {
  type: 'url',
  url: 'https://gmailmcp.googleapis.com/mcp/v1',
  name: 'gmail',
};

const CATEGORY_OPERATORS = {
  primary:    'category:primary',
  promotions: 'category:promotions',
  social:     'category:social',
  updates:    'category:updates',
};

function buildSystemPrompt(emailCount, categories) {
  const selectedKeys = Object.entries(categories)
    .filter(([, on]) => on)
    .map(([key]) => key);

  // Build the Gmail search query for the categories
  const allKeys = Object.keys(CATEGORY_OPERATORS);
  const allSelected = selectedKeys.length === allKeys.length;

  let categoryInstruction;
  if (allSelected || selectedKeys.length === 0) {
    categoryInstruction = 'Search across all Gmail inbox categories (Primary, Promotions, Social, and Updates).';
  } else {
    const operators = selectedKeys.map((k) => CATEGORY_OPERATORS[k]);
    const query = operators.length === 1
      ? operators[0]
      : `(${operators.join(' OR ')})`;
    const labels = selectedKeys.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(', ');
    categoryInstruction = `Search ONLY in these Gmail categories: ${labels}. Use the Gmail search query: ${query}`;
  }

  return `You are a Gmail assistant. Search the user's Gmail inbox for emails that contain List-Unsubscribe headers. ${categoryInstruction} Look through the last ${emailCount} emails. Deduplicate by sender domain. Return ONLY a valid JSON array (no markdown, no explanation) with this exact structure:
[{
  "id": "string (unique)",
  "senderName": "string",
  "senderEmail": "string",
  "domain": "string",
  "exampleSubject": "string",
  "unsubscribeMethod": "email | url | unknown",
  "unsubscribeValue": "string (the mailto or URL)"
}]`;
}

function buildUserMessage(emailCount, categories) {
  const selectedKeys = Object.entries(categories)
    .filter(([, on]) => on)
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
  const inboxLabel = selectedKeys.length === 4 || selectedKeys.length === 0
    ? 'all inbox categories'
    : selectedKeys.join(', ');
  return `Scan my Gmail ${inboxLabel} and find all mailing lists I am subscribed to in the last ${emailCount} emails. Return the JSON array only.`;
}

export async function scanInbox(apiKey, emailCount = 100, categories = { primary: true, promotions: true, social: true, updates: true }) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'mcp-client-2025-04-04',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: buildSystemPrompt(emailCount, categories),
      messages: [{ role: 'user', content: buildUserMessage(emailCount, categories) }],
      mcp_servers: [MCP_SERVER],
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body?.error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const body = await response.json();
  const { data, error } = parseClaudeJSON(body.content);

  if (error) throw new Error(error);
  if (!Array.isArray(data)) throw new Error('Unexpected response shape — expected a JSON array.');

  // Normalise items and add UI state fields
  return data.map((item, idx) => ({
    ...item,
    id: item.id ?? `item-${idx}`,
    checked: false,
    status: 'pending',
    statusMessage: '',
  }));
}
