import type { PriceRange } from "../types";

export const ZERO: PriceRange = { minimum: 0, maximum: 0 };

export const range = (minimum: number, maximum: number): PriceRange => ({ minimum, maximum });

export const add = (...rs: PriceRange[]): PriceRange =>
  rs.reduce((a, b) => ({ minimum: a.minimum + b.minimum, maximum: a.maximum + b.maximum }), ZERO);

export const scale = (r: PriceRange, factor: number): PriceRange => ({
  minimum: r.minimum * factor,
  maximum: r.maximum * factor,
});

export const pctOf = (r: PriceRange, pct: number): PriceRange => scale(r, pct / 100);

export const negate = (r: PriceRange): PriceRange => ({ minimum: -r.maximum, maximum: -r.minimum });

export const isZero = (r: PriceRange): boolean => r.minimum === 0 && r.maximum === 0;

export const midpoint = (r: PriceRange): number => (r.minimum + r.maximum) / 2;

/** Round both ends to the nearest step (default ₱500) for presentation. */
export const roundRange = (r: PriceRange, step = 500): PriceRange => ({
  minimum: Math.round(r.minimum / step) * step,
  maximum: Math.round(r.maximum / step) * step,
});

export function pesoRange(r: PriceRange, suffix = ""): string {
  const f = (n: number) => `₱${Math.round(n).toLocaleString("en-PH")}`;
  if (r.minimum === r.maximum) return `${f(r.minimum)}${suffix}`;
  return `${f(r.minimum)}–${f(r.maximum)}${suffix}`;
}
