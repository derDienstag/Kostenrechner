/**
 * Load-lookup dispatcher.
 *
 * Exposes a single `lookupLoads(country, plz, gk, gebHoehe, hoeheNN)`
 * function that the UI calls; per-country logic stays in the dedicated
 * modules (`de.js`, `at.js`, `ch.js`, `it.js`).
 *
 * Adding a new country: implement `XX_PLZ_ZONES`, `xxCalcWind`, and
 * `xxCalcSchnee` in `./xx.js`, then add an entry below.
 */

import { DE_PLZ_ZONES, deCalcWind, deCalcSchnee } from './de.js';
import { AT_PLZ_ZONES, atCalcWind, atCalcSchnee } from './at.js';
import { CH_PLZ_ZONES, chCalcWind, chCalcSchnee } from './ch.js';
import { IT_PLZ_ZONES, itCalcWind, itCalcSchnee } from './it.js';

/** Country-code → handler bundle. */
const COUNTRIES = {
  DE: { table: DE_PLZ_ZONES, wind: deCalcWind, snow: deCalcSchnee, plzLen: 5, plzPh: 'z.B. 80331' },
  AT: { table: AT_PLZ_ZONES, wind: atCalcWind, snow: atCalcSchnee, plzLen: 4, plzPh: 'z.B. 1010'  },
  CH: { table: CH_PLZ_ZONES, wind: chCalcWind, snow: chCalcSchnee, plzLen: 4, plzPh: 'z.B. 8001'  },
  IT: { table: IT_PLZ_ZONES, wind: itCalcWind, snow: itCalcSchnee, plzLen: 5, plzPh: 'z.B. 20121' },
};

/** ISO codes for which the helper is available. */
export const SUPPORTED_COUNTRIES = Object.keys(COUNTRIES);

/** UI hint (placeholder + maxLength) for the PLZ input. */
export function getPlzMeta(country) {
  const c = COUNTRIES[country];
  return c ? { len: c.plzLen, ph: c.plzPh } : { len: 5, ph: '' };
}

/**
 * Look up wind/snow loads for a given postal-code prefix.
 *
 * @param {string} country  ISO 2-letter country code.
 * @param {string} plz      Full PLZ/CAP string (only first 2 chars used).
 * @param {'I'|'II'|'III'|'IV'} gk
 * @param {number} gebHoehe Building reference height (m).
 * @param {number} hoeheNN  Site elevation above sea level (m).
 * @returns {{wz:number, sz:string, wind:number, snow:number} | null | 'unknown'}
 *   - object on success;
 *   - 'unknown' when the country is supported but the PLZ prefix isn't mapped;
 *   - null when the country is not supported or the input is too short.
 */
export function lookupLoads(country, plz, gk, gebHoehe, hoeheNN) {
  const c = COUNTRIES[country];
  if (!c || plz.length < 2) return null;
  const zone = c.table[plz.substring(0, 2)];
  if (!zone) return 'unknown';
  const [wz, sz] = zone;
  return {
    wz,
    sz,
    wind: c.wind(wz, gk, gebHoehe),
    snow: c.snow(sz, hoeheNN),
  };
}
