import { parseClaudeJSON } from '../utils/parseResponse';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MCP_SERVER = {
  type: 'url',
  url: 'https://gmailmcp.googleapis.com/mcp/v1',
  name: 'gmail',
};

const SYSTEM_PROMPT = `You are a Gmail assistant. Unsubscribe the user from the given mailing list using the provided unsubscribe method. If method is 'email', compose and send an unsubscribe email to the unsubscribeValue address. If method is 'url', use Gmail MCP to note the URL (and inform the user they must visit it manually). Confirm success or failure. Reply with only valid JSON: { "success": boolean, "message": string }`;

export async function unsubscribeOne(apiKey, item) {
  const { senderName, senderEmail, unsubscribeMethod, unsubscribeValue } = item;
  const userMessage = `Unsubscribe me from ${senderName} (${senderEmail}). Unsubscribe method: ${unsubscribeMethod}. Unsubscribe value: ${unsubscribeValue}`;

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
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
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

  return {
    success: Boolean(data?.success),
    message: data?.message || (data?.success ? 'Unsubscribed successfully.' : 'Unsubscribe may have failed.'),
  };
}
