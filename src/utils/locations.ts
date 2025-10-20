export const CANONICAL_LOCATIONS = [
  "Cincinnati — Broadwell Road",
  "Cincinnati — Colerain Avenue", 
  "Cincinnati — School Road",
  "Cincinnati — Waycross Road",
  "Cincinnati — West Seymour Avenue",
  "Elizabethtown — Peterson Drive",
  "Erlanger — Kenton Lane Road 100",
  "Florence — Industrial Road",
  "Franklin — Washington Way",
  "Georgetown — Triport Road",
  "Louisville — Intermodal Drive",
  "Sparta — Johnson Road",
] as const;

export type CanonicalLocation = typeof CANONICAL_LOCATIONS[number];

/** Map a raw location string to canonical, or return null (reject). */
export function mapLocation(raw?: string | null): CanonicalLocation | null {
  if (!raw) return null;
  const norm = raw.trim().toLowerCase();
  const match = (CANONICAL_LOCATIONS as readonly string[]).find(
    (c) => c.toLowerCase() === norm
  );
  return (match as CanonicalLocation) ?? null;
}
