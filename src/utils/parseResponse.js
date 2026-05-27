/**
 * Strip markdown code fences and return clean JSON string.
 */
export function stripFences(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

/**
 * Find the last text block in a Claude content array.
 * MCP calls may produce tool_use / tool_result blocks before the final answer.
 */
export function extractLastText(contentArray) {
  if (!Array.isArray(contentArray)) return null;
  const textBlocks = contentArray.filter((b) => b.type === 'text');
  if (textBlocks.length === 0) return null;
  return textBlocks[textBlocks.length - 1].text;
}

/**
 * Parse a Claude response body into JSON.
 * Returns { data, error }.
 */
export function parseClaudeJSON(contentArray) {
  const raw = extractLastText(contentArray);
  if (!raw) return { data: null, error: 'No text block found in response.' };

  const cleaned = stripFences(raw);
  try {
    const data = JSON.parse(cleaned);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: `Failed to parse JSON: ${err.message}. Raw: ${cleaned.slice(0, 200)}` };
  }
}
