/**
 * Austria — load lookup per ÖNORM B 1991-1-3/4 (national annex to Eurocode).
 *
 * PLZ is 4 digits; we key the lookup on the first 2 digits (Bundesland
 * granularity). Two regions stand out:
 *   - Burgenland & Marchfeld: pannonic plain, highest wind (WZ3) but
 *     little snow (SZ1).
 *   - Alps (Salzburg, Tirol, Vorarlberg, Bündner): SZ3 (alpine snow).
 *   - Vorarlberg also exposed to Föhn & Bodensee winds → WZ3.
 */

import { qpZ } from './eurocode.js';

export const AT_PLZ_ZONES = (() => {
  const z = {};
  // Wien (low-elevation basin)
  ['10','11','12','13','14','15','16','17','18','19'].forEach(k => (z[k] = [2, '1']));
  // Lower Austria — Marchfeld / Weinviertel (exposed pannonic plain)
  ['20','21','22'].forEach(k => (z[k] = [3, '1']));
  // Lower Austria — Wiener Becken / Thermenregion
  ['23','24','25','26','27','28'].forEach(k => (z[k] = [2, '1']));
  // Lower Austria — Voralpen / Mostviertel
  ['29','30','31','32','33','34','35','36','37','38','39'].forEach(k => (z[k] = [1, '2']));
  // Upper Austria — Linz / Wels / Steyr
  ['40','41','42','43','44','45','46','47','48','49'].forEach(k => (z[k] = [1, '2']));
  // Salzburg city + state (alpine!)
  ['50','51','52','53','54','55','56','57','58','59'].forEach(k => (z[k] = [1, '3']));
  // Tirol — Inntal / Osttirol
  ['60','61','62','63','64','65','66'].forEach(k => (z[k] = [1, '3']));
  // Vorarlberg — Rheintal / Bodensee (Föhn → WZ3, alpine snow)
  ['67','68','69'].forEach(k => (z[k] = [3, '3']));
  // Burgenland — Austria's windiest state (pannonic)
  ['70','71','72','73','74','75','76','77','78','79'].forEach(k => (z[k] = [3, '1']));
  // Steiermark — Graz Becken / Oststeiermark
  ['80','81','82','83','84','85','86','87','88','89'].forEach(k => (z[k] = [1, '2']));
  // Kärnten — Klagenfurt / Villach / Spittal
  ['90','91','92','93','94','95','96','97','98','99'].forEach(k => (z[k] = [1, '2']));
  return z;
})();

/** qb [kN/m²] per Austrian wind zone. */
const QB = { 1: 0.30, 2: 0.39, 3: 0.48 };

/**
 * Peak velocity pressure per ÖNORM B 1991-1-4.
 * @param {1|2|3} wz
 * @param {'I'|'II'|'III'|'IV'} gk
 * @param {number} z
 * @returns {number|null}
 */
export function atCalcWind(wz, gk, z) {
  return qpZ(QB[wz] ?? QB[2], gk, z);
}

/**
 * Characteristic snow load sk per ÖNORM B 1991-1-3.
 * Quadratic in elevation: sk = a + b · (H/1000)², floor per zone.
 *
 * @param {"1"|"2"|"3"} sz
 * @param {number} altNN m a.s.l.
 * @returns {number} sk in kN/m²
 */
export function atCalcSchnee(sz, altNN) {
  const h2 = (altNN / 1000) * (altNN / 1000);
  const formulas = {
    '1': 0.70 + 0.50 * h2,
    '2': 0.85 + 1.20 * h2,
    '3': 1.50 + 2.50 * h2,
  };
  const minima = { '1': 0.70, '2': 0.85, '3': 1.50 };
  const sk = formulas[sz] ?? (0.85 + 1.20 * h2);
  return Math.round(Math.max(sk, minima[sz] ?? 0.85) * 10) / 10;
}
