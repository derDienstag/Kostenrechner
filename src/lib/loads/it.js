/**
 * Italy — load lookup per NTC 2018 (Norme Tecniche per le Costruzioni).
 *
 * CAP (Codice di Avviamento Postale) is 5 digits. We key the lookup on
 * the first 2 digits. Coverage spans all 20 regions plus the islands.
 *
 * Snow scaling uses (H/1000)² with three regional zone strengths.
 * Wind has the highest qb at the boot (south + islands) and lowest in
 * the northern Apennine valleys.
 */

import { qpZ } from './eurocode.js';

export const IT_PLZ_ZONES = (() => {
  const z = {};
  // Piemonte / Valle d'Aosta
  ['10','11','12','13','14','15'].forEach(k => (z[k] = [1, '2']));
  z['11'] = [1, '3']; // Aosta — alpine
  // Liguria
  ['16','17','18','19'].forEach(k => (z[k] = [3, '1']));
  // Lombardia
  ['20','21','22','24','25'].forEach(k => (z[k] = [1, '2']));
  z['23'] = [1, '3']; // Sondrio — alpine
  ['26','27'].forEach(k => (z[k] = [2, '2']));
  z['28'] = [1, '2']; // Novara
  z['29'] = [2, '2']; // Piacenza
  // Trentino-Alto Adige — full alpine
  z['38'] = [1, '3']; z['39'] = [1, '3'];
  // Veneto / FVG
  ['30','31','33','35','36','37'].forEach(k => (z[k] = [1, '2']));
  z['32'] = [1, '3']; // Belluno — alpine
  z['34'] = [3, '1']; // Trieste — coastal
  // Emilia-Romagna
  ['40','41','42','43','44','47','48'].forEach(k => (z[k] = [2, '2']));
  z['45'] = [2, '2']; // Rovigo
  z['46'] = [1, '2']; // Mantova
  // Toscana
  ['50','51','52','53','54','55','56','58','59'].forEach(k => (z[k] = [2, '2']));
  z['57'] = [3, '1']; // Livorno — coastal
  // Marche / Umbria / Lazio
  ['60','61','62','63','64'].forEach(k => (z[k] = [2, '2']));
  ['05','06'].forEach(k => (z[k] = [2, '2'])); // Umbria
  ['00','01','02','03'].forEach(k => (z[k] = [2, '2'])); // Roma / Lazio
  z['04'] = [2, '1']; // Latina
  // Abruzzo / Molise
  ['65','66','86'].forEach(k => (z[k] = [2, '2']));
  z['67'] = [2, '3']; // L'Aquila — high Apennines
  // Campania / Basilicata
  ['80','81','82','83','84','85'].forEach(k => (z[k] = [2, '1']));
  // Puglia
  ['70','71','72','73','74','76'].forEach(k => (z[k] = [3, '1']));
  z['75'] = [2, '1']; // Matera — inland
  // Calabria
  ['87','88'].forEach(k => (z[k] = [2, '1']));
  z['89'] = [3, '1']; // Reggio Calabria — strait
  // Sicilia
  ['90','91','92','95','96','97','98'].forEach(k => (z[k] = [3, '1']));
  ['93','94'].forEach(k => (z[k] = [2, '1'])); // Caltanissetta / Enna inland
  // Sardegna
  z['07'] = [3, '1']; z['09'] = [3, '1']; z['08'] = [2, '1'];
  return z;
})();

/** qb [kN/m²] per Italian wind zone (NTC 2018). */
const QB = { 1: 0.32, 2: 0.45, 3: 0.56 };

/**
 * Peak velocity pressure per NTC 2018.
 * @param {1|2|3} wz
 * @param {'I'|'II'|'III'|'IV'} gk
 * @param {number} z
 */
export function itCalcWind(wz, gk, z) {
  return qpZ(QB[wz] ?? QB[2], gk, z);
}

/**
 * Characteristic snow load sk per NTC 2018 (simplified).
 *
 * @param {"1"|"2"|"3"} sz
 * @param {number} altNN
 * @returns {number} kN/m²
 */
export function itCalcSchnee(sz, altNN) {
  const h2 = (altNN / 1000) * (altNN / 1000);
  const formulas = {
    '1': 0.40 + 0.50 * h2,
    '2': 0.60 + 1.50 * h2,
    '3': 1.20 + 3.00 * h2,
  };
  const minima = { '1': 0.40, '2': 0.60, '3': 1.20 };
  const sk = formulas[sz] ?? (0.60 + 1.50 * h2);
  return Math.round(Math.max(sk, minima[sz] ?? 0.60) * 10) / 10;
}
