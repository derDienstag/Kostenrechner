/**
 * Eurocode wind exposure helper (EN 1991-1-4).
 *
 * The peak velocity pressure at height z above ground is:
 *
 *   qp(z) = [1 + 7/ln(z_eff/z0)] · kr² · ln²(z_eff/z0) · qb
 *
 * where:
 *   qb        basic velocity pressure (zone-dependent, set in each NA)
 *   z_eff     max(z, z_min) — z_min protects against unrealistically low
 *             values inside the surface boundary layer
 *   z0        roughness length for the terrain category
 *   kr        terrain factor = 0.19 · (z0 / 0.05)^0.07
 *
 * Germany (DIN), Austria (ÖNORM B), Switzerland (SIA — uses the same
 * functional form), and Italy (NTC) all share this formula; they differ
 * only in `qb` values.
 */

/**
 * Roughness lengths and minimum reference heights for the four Eurocode
 * terrain categories (Geländekategorien / Gelände-Kategorien). Values
 * per EN 1991-1-4 Tab. 4.1.
 *
 *   I:   Sea / coastal / lake shore — smooth
 *   II:  Open country, low vegetation
 *   III: Suburban / forest edge — medium roughness
 *   IV:  Urban / inner city — high roughness
 */
export const TERRAIN_CATEGORIES = Object.freeze({
  I:   { z0: 0.01, zmin: 2  },
  II:  { z0: 0.05, zmin: 4  },
  III: { z0: 0.30, zmin: 8  },
  IV:  { z0: 1.00, zmin: 16 },
});

/**
 * Compute peak velocity pressure qp(z) using the Eurocode exposure
 * factor formulation.
 *
 * @param {number} qb           Basic velocity pressure (kN/m²).
 * @param {'I'|'II'|'III'|'IV'} gk Terrain category.
 * @param {number} z            Reference height above ground (m).
 * @returns {number|null}       qp(z) rounded to one decimal (kN/m²),
 *                              or null if `gk` is unknown.
 */
export function qpZ(qb, gk, z) {
  const params = TERRAIN_CATEGORIES[gk];
  if (!params) return null;
  const { z0, zmin } = params;
  const kr = 0.19 * Math.pow(z0 / 0.05, 0.07);
  const lnZ = Math.log(Math.max(z, zmin) / z0);
  const qp = (1 + 7 / lnZ) * kr * kr * lnZ * lnZ * qb;
  return Math.round(qp * 10) / 10;
}
