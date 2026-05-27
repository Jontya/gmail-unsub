import { parseClaudeJSON } from '../utils/parseResponse';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MCP_SERVER = {
  type: 'url',
  url: 'https://gmailmcp.googleapis.com/mcp/v1',
  name: 'gmail',
};

const SYSTEM_PROMPT = `You are a Gmail assistant. Search the user's Gmail inbox for emails that contain List-Unsubscribe headers. Look through at least the last 100 emails. Deduplicate by sender domain. Return ONLY a valid JSON array (no markdown, no explanation) with this exact structure:
[{
  "id": "string (unique)",
  "senderName": "string",
  "senderEmail": "string",
  "domain": "string",
  "exampleSubject": "string",
  "unsubscribeMethod": "email | url | unknown",
  "unsubscribeValue": "string (the mailto or URL)"
}]`;

const USER_MESSAGE = 'Scan my Gmail inbox and find all mailing lists I am subscribed to. Return the JSON array only.';

export async function scanInbox(apiKey) {
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
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_MESSAGE }],
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
