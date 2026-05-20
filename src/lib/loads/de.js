/**
 * Germany — load lookup per DIN EN 1991-1-3/NA (snow) and DIN EN 1991-1-4/NA (wind).
 *
 * PLZ (postal code) regions are mapped by their first two digits to
 * a [windZone (1–4), snowZone ("1"|"1a"|"2"|"2a"|"3")] tuple.
 * Zone boundaries do *not* follow PLZ borders exactly — values are
 * indicative defaults; structural calculation always required.
 */

import { qpZ } from './eurocode.js';

/**
 * 2-digit PLZ prefix → [wind zone, snow zone].
 * Built once on import.
 */
export const DE_PLZ_ZONES = (() => {
  const z = {};
  // Sachsen / Ostthüringen / Erzgebirge
  ['01', '02', '07', '08', '09'].forEach(k => (z[k] = [1, '2']));
  // Leipzig Tiefland / Halle
  ['04', '06'].forEach(k => (z[k] = [2, '1']));
  // Cottbus / Niederlausitz
  z['03'] = [2, '1'];
  // Berlin
  ['10', '12', '13'].forEach(k => (z[k] = [2, '1']));
  // Potsdam / Brandenburg
  ['14', '15', '16'].forEach(k => (z[k] = [2, '1']));
  // Mecklenburg-Vorpommern coast
  ['17', '18'].forEach(k => (z[k] = [3, '1']));
  z['19'] = [2, '1']; // Schwerin (inland)
  // Hamburg core (WZ3)
  ['20', '22'].forEach(k => (z[k] = [3, '1']));
  z['21'] = [2, '1']; // Hamburg surroundings
  z['23'] = [2, '1']; // Lübeck
  // Kiel / Schleswig-Holstein West
  ['24', '25'].forEach(k => (z[k] = [3, '1']));
  // Oldenburg / Wilhelmshaven / Bremerhaven — North Sea coast
  ['26', '27'].forEach(k => (z[k] = [3, '1']));
  z['28'] = [3, '1']; // Bremen
  z['29'] = [2, '1']; // Lüneburg / Heath
  // Hannover / Braunschweig / Magdeburg
  ['30', '31', '32', '38', '39'].forEach(k => (z[k] = [2, '1']));
  z['33'] = [2, '1']; // Paderborn
  z['34'] = [1, '2']; // Kassel — hilly
  z['35'] = [1, '1']; // Marburg
  z['36'] = [1, '2']; // Fulda / Rhön
  z['37'] = [1, '2']; // Göttingen
  // Düsseldorf / Mönchengladbach / Ruhr / Münster
  ['40', '41', '44', '45', '46', '47', '48', '49'].forEach(k => (z[k] = [2, '1']));
  z['42'] = [1, '1']; // Wuppertal — sheltered
  // Cologne / Aachen / Bonn
  ['50', '52', '53'].forEach(k => (z[k] = [1, '1']));
  z['51'] = [1, '2']; // Bergisches Land
  // Trier / Mainz / Koblenz
  ['54', '55', '56'].forEach(k => (z[k] = [1, '1']));
  // Siegen / Sauerland
  ['57', '58'].forEach(k => (z[k] = [1, '2']));
  z['59'] = [2, '1']; // Hamm
  // Frankfurt / Wiesbaden
  ['60', '61', '63', '64', '65'].forEach(k => (z[k] = [1, '1']));
  z['66'] = [1, '1']; // Saarland
  z['67'] = [1, '2']; // Kaiserslautern / Pfälzerwald
  ['68', '69'].forEach(k => (z[k] = [1, '1'])); // Mannheim / Heidelberg
  z['70'] = [1, '1']; // Stuttgart
  // Reutlingen / Göppingen / Sigmaringen
  ['71', '72', '73'].forEach(k => (z[k] = [1, '2']));
  // Heilbronn / Pforzheim / Karlsruhe
  ['74', '75', '76'].forEach(k => (z[k] = [1, '1']));
  z['77'] = [1, '2']; // Offenburg / Schwarzwald West
  z['78'] = [1, '2']; // Villingen / Konstanz / Bodensee
  z['79'] = [1, '3']; // Freiburg / Südschwarzwald (Feldberg!)
  // München
  ['80', '81'].forEach(k => (z[k] = [1, '2']));
  z['82'] = [1, '2']; // Oberbayern / Voralpen
  z['83'] = [1, '2a']; // Rosenheim / Traunstein
  // Landshut / Ingolstadt / Augsburg
  ['84', '85', '86'].forEach(k => (z[k] = [1, '2']));
  z['87'] = [1, '3']; // Kempten / Allgäu (alpine!)
  z['88'] = [1, '3']; // Ravensburg / Immenstadt
  z['89'] = [1, '2']; // Ulm / Neu-Ulm
  // Nürnberg, Bayreuth, Bamberg etc.
  ['90', '91', '92', '93', '94', '95', '96'].forEach(k => (z[k] = [1, '2']));
  z['97'] = [1, '1']; // Würzburg — mild
  // Erfurt / Gotha / Eisenach
  ['98', '99'].forEach(k => (z[k] = [1, '2']));
  return z;
})();

/** Basic velocity pressure qb [kN/m²] per German wind zone. */
const QB = { 1: 0.32, 2: 0.39, 3: 0.48, 4: 0.56 };

/**
 * Peak velocity pressure qp(z) per DIN EN 1991-1-4/NA.
 *
 * @param {1|2|3|4} windzone     German wind zone.
 * @param {'I'|'II'|'III'|'IV'} gk Terrain category.
 * @param {number} z             Reference height (m).
 * @returns {number|null}        kN/m², or null if `gk` invalid.
 */
export function deCalcWind(windzone, gk, z) {
  return qpZ(QB[windzone] ?? QB[2], gk, z);
}

/**
 * Characteristic snow load sk per DIN EN 1991-1-3/NA.
 *
 * Each zone has its own formula in terms of site elevation H [m a.s.l.]:
 *   t  = (H + 140) / 760
 *   sk = a + b · t²
 * with (a, b) from the Annex; a floor of 0.65 kN/m² is always applied.
 *
 * @param {"1"|"1a"|"2"|"2a"|"3"} sz Snow zone.
 * @param {number} altNN            Site elevation in m above sea level.
 * @returns {number}                sk rounded to one decimal (kN/m²).
 */
export function deCalcSchnee(sz, altNN) {
  const t2 = Math.pow((altNN + 140) / 760, 2);
  const formulas = {
    '1':  0.19 + 0.91 * t2,
    '1a': 0.25 + 1.91 * t2,
    '2':  0.25 + 1.06 * t2,
    '2a': 0.31 + 2.91 * t2,
    '3':  0.31 + 2.91 * t2,
  };
  const sk = formulas[sz] ?? (0.25 + 1.06 * t2);
  return Math.round(Math.max(sk, 0.65) * 10) / 10;
}
