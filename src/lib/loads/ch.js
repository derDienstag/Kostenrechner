/**
 * Switzerland — load lookup per SIA 261.
 *
 * Swiss snow loads follow the H^1.5 form rather than the H² of the
 * German/Austrian annexes (alpine snow scales more aggressively).
 * Floor values are also significantly higher than in DE/AT.
 *
 * Three notable patterns:
 *   - Plateau (Vaud–Zürich): WZ2 / SZ1 → mild
 *   - Jura / Neuenburg: WZ3 / SZ2 (exposed, snowy)
 *   - Graubünden / inneres Wallis / Berner Oberland: full alpine SZ3
 *   - St. Gallen Rheintal & Appenzell: Föhn → WZ3
 */

import { qpZ } from './eurocode.js';

export const CH_PLZ_ZONES = (() => {
  const z = {};
  // Vaud / Genève / Fribourg — Plateau
  ['10','11','12','13','14','15','16','17','18'].forEach(k => (z[k] = [2, '1']));
  z['19'] = [1, '2']; // Valais — Rhônetal (sheltered)
  // Neuenburg / Jura — exposed
  ['20','21','22','23','24','25','26','27','28','29'].forEach(k => (z[k] = [3, '2']));
  // Bern city + Mittelland
  ['30','31','32','33','34'].forEach(k => (z[k] = [2, '1']));
  // Berner Oberland / Emmental (sub-alpine)
  ['35','36','37','38','39'].forEach(k => (z[k] = [2, '3']));
  // Basel / Solothurn
  ['40','41','42','43','44'].forEach(k => (z[k] = [2, '1']));
  // Aargau
  ['45','46','47','48','49','50','51','52','53'].forEach(k => (z[k] = [2, '1']));
  // Luzern — Mittelland
  ['60','61','62','63'].forEach(k => (z[k] = [2, '2']));
  // Schwyz / Uri — sub-alpine/alpine
  ['64','65'].forEach(k => (z[k] = [1, '3']));
  // Obwalden / Nidwalden / Zug
  ['66','67','68','69'].forEach(k => (z[k] = [1, '2']));
  // Graubünden — alpine
  ['70','71','72','73','74','75','76','77','78','79'].forEach(k => (z[k] = [1, '3']));
  // Zürich
  ['80','81','82'].forEach(k => (z[k] = [2, '1']));
  // Winterthur / Schaffhausen / Thurgau
  ['83','84','85'].forEach(k => (z[k] = [2, '2']));
  // Glarus / St. Gallen west
  ['86','87','88'].forEach(k => (z[k] = [2, '2']));
  z['89'] = [3, '2']; // St. Gallen east — Föhn
  // St. Gallen
  ['90','91','92','93'].forEach(k => (z[k] = [2, '2']));
  // Appenzell / Rheintal — Föhn
  ['94','95','96','97','98','99'].forEach(k => (z[k] = [3, '2']));
  return z;
})();

/** qb [kN/m²] per Swiss wind zone (SIA 261). */
const QB = { 1: 0.30, 2: 0.40, 3: 0.55 };

/**
 * Peak velocity pressure per SIA 261.
 * @param {1|2|3} wz
 * @param {'I'|'II'|'III'|'IV'} gk
 * @param {number} z
 */
export function chCalcWind(wz, gk, z) {
  return qpZ(QB[wz] ?? QB[2], gk, z);
}

/**
 * Characteristic snow load sk per SIA 261.
 * Uses (H/1000)^1.5 — alpine scaling.
 *
 * @param {"1"|"2"|"3"} sz
 * @param {number} altNN
 * @returns {number} kN/m²
 */
export function chCalcSchnee(sz, altNN) {
  const h15 = Math.pow(altNN / 1000, 1.5);
  const formulas = {
    '1': 0.70 + 1.80 * h15,
    '2': 1.00 + 2.50 * h15,
    '3': 2.00 + 3.50 * h15,
  };
  const minima = { '1': 0.90, '2': 1.20, '3': 2.50 };
  const sk = formulas[sz] ?? (1.00 + 2.50 * h15);
  return Math.round(Math.max(sk, minima[sz] ?? 1.20) * 10) / 10;
}
