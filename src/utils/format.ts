const SUP_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

export function supDigits(value: number, pad = 2): string {
  return value
    .toString()
    .padStart(pad, '0')
    .split('')
    .map((c) => SUP_DIGITS[Number(c)])
    .join('');
}

export function taskCountLabel(open: number, done: number): string {
  return `${open} open · ${done} done`;
}

export function formatTaskTime(epoch: number): string {
  const d = new Date(epoch);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3.6e6);
  if (diffH < 1) return 'now';
  if (diffH < 24) return `${diffH}ʰ`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}ᵈ`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function supMm(value: number): string {
  const rounded = Math.round(value);
  return `${rounded.toString()}ᴹᴹ`;
}
