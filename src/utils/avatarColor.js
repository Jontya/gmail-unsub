const COLORS = [
  { bg: '#e8f0fe', fg: '#1a73e8' }, // blue
  { bg: '#fce8e6', fg: '#d93025' }, // red
  { bg: '#e6f4ea', fg: '#188038' }, // green
  { bg: '#fef7e0', fg: '#e37400' }, // yellow
  { bg: '#f3e8fd', fg: '#8430ce' }, // purple
  { bg: '#e8f5fb', fg: '#0097a7' }, // teal
];

/**
 * Deterministic color pick from a string.
 */
export function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

/**
 * Returns the initial letter for an avatar.
 */
export function avatarInitial(name = '') {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}
