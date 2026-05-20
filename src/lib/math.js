/**
 * Tiny math helpers used by the pricing engine.
 */

/**
 * Evaluate a polynomial via Horner's rule.
 *
 *   evalPoly([a3, a2, a1, a0], x) === a3·x³ + a2·x² + a1·x + a0
 *
 * Coefficients are stored highest-degree-first to match the output of
 * the upstream regression script.
 *
 * @param {number[]} coef
 * @param {number}   x
 */
export function evalPoly(coef, x) {
  let y = 0;
  for (const c of coef) y = y * x + c;
  return y;
}

/**
 * Piecewise-linear interpolation through a list of (x, y) points.
 * Clamps to the endpoint values outside the data range.
 *
 * @param {number[][]} pts  [[x, y], ...]
 * @param {number} x
 * @returns {number}
 */
export function interp1D(pts, x) {
  if (!pts || !pts.length) return 0;
  const sorted = [...pts].sort((a, b) => a[0] - b[0]);
  if (x <= sorted[0][0]) return sorted[0][1];
  if (x >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i][0] <= x && x <= sorted[i + 1][0]) {
      const t = (x - sorted[i][0]) / (sorted[i + 1][0] - sorted[i][0]);
      return sorted[i][1] + t * (sorted[i + 1][1] - sorted[i][1]);
    }
  }
  return sorted[sorted.length - 1][1];
}
