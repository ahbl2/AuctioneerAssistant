/** Strip $, commas, whitespace → number | null */
export function parseMoney(text?: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const val = Number(cleaned);
  return Number.isFinite(val) ? val : null;
}

/** "1d 2h 3m 4s" (any subset) → seconds | null */
export function parseTimeLeftToSeconds(text?: string | null): number | null {
  if (!text) return null;
  let seconds = 0;
  const re = /(\d+)\s*(d|h|m|s)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const v = Number(m[1]);
    const u = m[2].toLowerCase();
    if (u === "d") seconds += v * 86400;
    else if (u === "h") seconds += v * 3600;
    else if (u === "m") seconds += v * 60;
    else if (u === "s") seconds += v;
  }
  return seconds > 0 ? seconds : null;
}
