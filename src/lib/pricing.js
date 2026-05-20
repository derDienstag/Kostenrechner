/**
 * Pricing engine.
 *
 * Evaluates a model (selected by composite key) and returns either a
 * price (€/kWp) or a status flag that tells the UI to show "on request"
 * or "model not available". The engine never raises — every failure
 * mode is encoded in the returned `status` field.
 *
 * Status values:
 *   'ok'             — `preis` is a usable number
 *   'extrapoliert'   — `preis` is valid but inputs are outside fit range
 *   'anfrage'        — sales contact required (`meta.grund` explains why)
 *   'unbekannt'      — no model exists for the composite key
 */

import { evalPoly, interp1D } from './math.js';
import { GROUND_SYSTEMS } from './constants.js';

/**
 * Build the composite lookup key for a model.
 * Pitch and Metal categories don't have klemmung/ausrichtung — they
 * use placeholder dashes so the key shape stays uniform.
 */
export function makeKey(kat, sys, aus, klem) {
  if (kat === 'Pitch' || kat === 'Metal') return `${kat}|${sys}|—|—`;
  return `Flat|${sys}|${aus}|${klem}`;
}

/**
 * Pre-index the model config so the UI can render system pickers
 * without scanning the full table on every render.
 *
 * Returns:
 *   {
 *     flat:  { [system]: { system, variants[], klemmungen[], ausrichtungen[] } }
 *     pitch: [{ key, system }, ...]
 *     metal: [{ key, system }, ...]
 *   }
 *
 * @param {{models: object}} config
 */
export function indexConfig(config) {
  const flat = {}, pitch = [], metal = [];
  for (const [key, m] of Object.entries(config.models)) {
    if (m.kategorie === 'Flat') {
      if (!flat[m.system]) flat[m.system] = { system: m.system, variants: [] };
      flat[m.system].variants.push({ key, klemmung: m.klemmung, ausrichtung: m.ausrichtung });
    } else if (m.kategorie === 'Pitch') {
      pitch.push({ key, system: m.system });
    } else if (m.kategorie === 'Metal') {
      metal.push({ key, system: m.system });
    }
  }
  // Derive the unique sets used by Segmented controls.
  for (const sys of Object.values(flat)) {
    sys.klemmungen     = [...new Set(sys.variants.map(v => v.klemmung))];
    sys.ausrichtungen  = [...new Set(sys.variants.map(v => v.ausrichtung))];
  }
  return { flat, pitch, metal };
}

/**
 * Compute the indicative €/kWp price for a configuration.
 *
 * @param {object} args
 * @param {string} args.kategorie   'Flat'|'Pitch'|'Metal'|'GROUND'
 * @param {string} args.system      System name, e.g. 'S10plus'
 * @param {string} args.ausrichtung 'Süd' | 'Ost/West' | '—'
 * @param {string} args.klemmung    'KSK' | 'LSK' | '—'
 * @param {number} args.schnee      Snow load (kN/m²)
 * @param {number} args.wind        Wind load (kN/m²)
 * @param {object} args.config      Full model config (see config.js)
 * @param {object} args.t           Translation table (for status messages)
 *
 * @returns {{
 *   preis: number|null,
 *   status: 'ok'|'extrapoliert'|'anfrage'|'unbekannt',
 *   meta: object
 * }}
 */
export function richtpreisProKwp({ kategorie, system, ausrichtung, klemmung, schnee, wind, config, t }) {
  // Ground-mount: reuse the matching Flat model.
  if (kategorie === 'GROUND') {
    const g = GROUND_SYSTEMS.find(g => g.system === system) || GROUND_SYSTEMS[0];
    kategorie  = 'Flat';
    system     = g.system;
    ausrichtung = g.ausrichtung;
    klemmung   = g.klemmung;
  }

  const key = makeKey(kategorie, system, ausrichtung, klemmung);
  const m = config.models[key];
  if (!m) return { preis: null, status: 'unbekannt', meta: { key, reason: '—' } };

  // Hard-coded "no data → sales contact" signal from upstream.
  if (m.type === 'no_data') {
    return { preis: null, status: 'anfrage', meta: { key, grund: t?.bitteVertriebAnfragen || 'Anfrage erforderlich' } };
  }
  // Above the wind/snow "anfrage" threshold: force sales handoff even
  // though a number could be extrapolated — protects against bad quotes
  // in load regimes we haven't validated.
  if (m.wind_anfrage_threshold != null && wind >= m.wind_anfrage_threshold) {
    return { preis: null, status: 'anfrage', meta: { key, grund: `${t?.windlast || 'Wind'} ≥ ${m.wind_anfrage_threshold} kN/m²` } };
  }
  if (m.snow_anfrage_threshold != null && schnee >= m.snow_anfrage_threshold) {
    return { preis: null, status: 'anfrage', meta: { key, grund: `${t?.schneelast || 'Schnee'} ≥ ${m.snow_anfrage_threshold} kN/m²` } };
  }

  // Evaluate the model.
  let preis;
  if      (m.type === 'constant')            preis = m.value;
  else if (m.type === 'poly_wind')           preis = evalPoly(m.wind_coef, wind);
  else if (m.type === 'separable_2d')        preis = m.base + evalPoly(m.wind_coef, wind) + evalPoly(m.snow_coef, schnee);
  else if (m.type === 'separable_2d_interp') preis = m.base + interp1D(m.wind_pts, wind) + interp1D(m.snow_pts, schnee);
  else return { preis: null, status: 'unbekannt', meta: { key } };

  // Range check — outside the fit domain we still return the number
  // but flag it so the UI can warn the user.
  const ausserhalb = [];
  if (m.wind_range && (wind   < m.wind_range[0] || wind   > m.wind_range[1])) {
    ausserhalb.push(`${t?.windlast    || 'Wind'} ${wind.toFixed(1)}   ∉ [${m.wind_range[0]}, ${m.wind_range[1]}]`);
  }
  if (m.snow_range && (schnee < m.snow_range[0] || schnee > m.snow_range[1])) {
    ausserhalb.push(`${t?.schneelast  || 'Schnee'} ${schnee.toFixed(1)} ∉ [${m.snow_range[0]}, ${m.snow_range[1]}]`);
  }
  const status = ausserhalb.length ? 'extrapoliert' : 'ok';

  return {
    preis: Math.round(preis * 100) / 100,
    status,
    meta: { key, ausserhalb, model: m.type, m },
  };
}
