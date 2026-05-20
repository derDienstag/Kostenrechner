/**
 * Application-wide constants.
 *
 * Centralised so version-bumped localStorage keys (used to invalidate
 * cached user config when the schema changes) and the admin password
 * hash are easy to find.
 */

/** SHA-256 of the admin password. Used by `LoginModal` to gate access. */
export const ADMIN_PASSWORD_HASH =
  '7da41059a46f5f3980547844205d27b646ac32baa60316896bd044c0bf1ee852';

/** localStorage keys. Increment the suffix when the stored shape changes. */
export const LS_KEYS = Object.freeze({
  config:  'aerocompact-config-v9',
  factors: 'aerocompact-factors-v5',
  auth:    'aerocompact-admin-session',
  lang:    'aerocompact-lang',
});

/** Admin session lifetime — 4 hours. */
export const ADMIN_SESSION_MS = 4 * 60 * 60 * 1000;

/** Supported UI languages. */
export const LANGUAGES = ['de', 'en', 'it'];

/** Default country price-multiplier. International accounts get a small uplift. */
export const FALLBACK_COUNTRY_FACTORS = Object.freeze({
  DE: 1.0,
  AT: 1.0,
  CH: 1.0,
  IT: 1.0,
  OTHER: 0.95,
});

/**
 * CompactGROUND product variants. Both reuse Flat-system pricing
 * (GS10plus East/West KSK, GS15 South KSK) because mechanically the
 * ground-mount and equivalent flat-roof installation share the bracket
 * family — only the substructure differs.
 */
export const GROUND_SYSTEMS = Object.freeze([
  { system: 'GS10plus', ausrichtung: 'Ost/West', klemmung: 'KSK' },
  { system: 'GS15',     ausrichtung: 'Süd',      klemmung: 'KSK' },
]);

/**
 * Compute the SHA-256 hash of an arbitrary string and return it as a
 * lower-case hex string. Used to compare an admin password attempt
 * against `ADMIN_PASSWORD_HASH` without ever storing the plaintext.
 *
 * @param {string} str
 * @returns {Promise<string>} 64-char lowercase hex
 */
export async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Deep-clone via JSON round-trip. Only safe for plain JSON-serialisable values. */
export const clone = o => JSON.parse(JSON.stringify(o));
