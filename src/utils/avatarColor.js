// Glass-friendly palette — semi-transparent tints with bright text
const COLORS = [
  { bg: 'rgba(61,158,255,0.28)',  fg: 'rgba(172,220,255,1)' }, // blue
  { bg: 'rgba(255,69,58,0.28)',   fg: 'rgba(255,160,155,1)' }, // red
  { bg: 'rgba(50,215,75,0.25)',   fg: 'rgba(140,230,160,1)' }, // green
  { bg: 'rgba(255,214,10,0.25)',  fg: 'rgba(255,235,120,1)' }, // yellow
  { bg: 'rgba(191,90,242,0.28)',  fg: 'rgba(220,170,255,1)' }, // purple
  { bg: 'rgba(90,200,250,0.25)',  fg: 'rgba(170,235,255,1)' }, // teal
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
