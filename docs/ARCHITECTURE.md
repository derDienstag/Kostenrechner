# Architecture

## Goals

1. **Pure-static deploy.** The site must work served as a folder of files
   on GitHub Pages — no server, no API.
2. **All math in plain JS modules.** Pricing and load formulas live in
   `src/lib/`, framework-free, so they can be tested in isolation and
   are obvious to a structural engineer reading the source.
3. **One owner of mutable state.** Every `useState` lives in `App.jsx`.
   Components are presentational; they receive props + setters.

## High-level data flow

```
                        ┌──────────────────────────────┐
                        │  localStorage                │
                        │  – config (models)           │
                        │  – country factors           │
                        │  – language                  │
                        │  – admin session             │
                        └──────────┬───────────────────┘
                                   │ hydrate on mount
                                   ▼
   user input ─────►  App.jsx (state)  ─────────────► useMemo:
   (sliders, picks)         │                          richtpreisProKwp()
                            │                              │
                            ▼                              ▼
                       Sub-components            { preis, status, meta }
                       receive props                       │
                            │                              ▼
                            ◄────── ResultCard renders €/kWp + total
```

## Module responsibilities

### `src/lib/` (framework-free)

| File                       | Responsibility |
|----------------------------|----------------|
| `constants.js`             | localStorage keys, admin hash, `sha256Hex`, `clone`, country factors, ground systems |
| `config.js`                | `FALLBACK_CONFIG.models` — regression coefficients per system |
| `bom.js`                   | `BOM_DATA` tables + `getBomEstimate()` |
| `i18n.js`                  | `T = { de, en, it }` translation tables |
| `math.js`                  | `evalPoly` (Horner), `interp1D` (piecewise linear) |
| `pricing.js`               | `richtpreisProKwp()`, `indexConfig()`, `makeKey()` |
| `useAnimatedNumber.js`     | RAF-based number tween hook |
| `loads/eurocode.js`        | Shared `qpZ(qb, gk, z)` peak velocity formula |
| `loads/{de,at,ch,it}.js`   | PLZ tables, per-country wind/snow calculations |
| `loads/index.js`           | `lookupLoads(country, plz, gk, gebHoehe, hoeheNN)` dispatcher |

### `src/components/`

All components are stateless except `LastenHelper` (form inputs) and
`AdminBackend` (JSON draft). State flows downward via props; events flow
upward via setters.

| Component        | Notes |
|------------------|-------|
| `Header`         | Sticky top bar with language switcher + admin controls |
| `Icon`           | Lookup-by-name wrapper around `lucide-react` |
| `SystemPicker`   | Category tabs + system / klemmung / ausrichtung pickers |
| `SliderField`    | Range slider with badge readout (wind, snow) |
| `Segmented`      | Two-option toggle (KSK/LSK, Süd/O-W) |
| `LastenHelper`   | Collapsible PLZ → load helper |
| `ResultCard`     | Headline €/kWp + per-module + total; "Anfrage" state |
| `BomPanel`       | Material estimate table + CSV download |
| `AdminBackend`   | Config JSON editor + country-factor table |
| `LoginModal`     | Admin password gate |

## Pricing pipeline

```
   category, system, klemmung, ausrichtung
              │
              ▼
   makeKey()  →  "Flat|S10plus|Ost/West|KSK"
              │
              ▼
   config.models[key]
              │
              ▼
   richtpreisProKwp() → { preis, status, meta }
              │
              ▼
   App.jsx multiplies by countryFactor × (1 − discount)
              │
              ▼
   ResultCard renders animated number
```

### Model types

| `type`                | Formula                                  | Where used |
|-----------------------|------------------------------------------|------------|
| `constant`            | `value`                                  | (unused at present) |
| `poly_wind`           | `evalPoly(wind_coef, wind)`              | Flat (snow has no effect) |
| `separable_2d`        | `base + poly(wind) + poly(snow)`         | Pitch, Metal |
| `separable_2d_interp` | `base + interp1D(wind_pts, wind) + interp1D(snow_pts, snow)` | Metal/TLE |
| `no_data`             | (always returns `status: "anfrage"`)     | XWS, TSE, TR |

Above `wind_anfrage_threshold` or `snow_anfrage_threshold`, the engine
short-circuits to `"anfrage"` regardless of model type.

## Persistence

`localStorage` keys (see `src/lib/constants.js`):

| Key                              | Contents                       | Versioned? |
|----------------------------------|--------------------------------|------------|
| `aerocompact-config-v9`          | Full `FALLBACK_CONFIG` object  | Yes — bump suffix to invalidate |
| `aerocompact-factors-v5`         | Country price factors          | Yes |
| `aerocompact-admin-session`      | `{ exp: <unix ms> }`           | No |
| `aerocompact-lang`               | `"de"`/`"en"`/`"it"`           | No |

The version suffix exists so we can ship breaking schema changes without
users seeing stale data — they simply fall back to `FALLBACK_*`.

## Build

Vite produces a single hashed JS bundle, a CSS bundle, and a small
`index.html`. `base: './'` (in `vite.config.js`) ensures asset URLs work
both at the GitHub Pages sub-path and locally as a static file.

## Adding things

- **A new country:** add `src/lib/loads/xx.js` (PLZ table + wind/snow
  funcs), register it in `loads/index.js`, add `XX` to `i18n.js`
  `countries` + `lasthinweisXX`, and to `FALLBACK_COUNTRY_FACTORS`.
- **A new pricing model:** run the offline regression, paste the JSON
  into the admin backend. No code change required.
- **A new icon:** import it in `src/components/Icon.jsx` and add it to
  the `ICONS` map.
