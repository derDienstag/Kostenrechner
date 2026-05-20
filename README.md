# AEROCOMPACT Richtpreis-Rechner

Quick price orientation for AEROCOMPACT solar mounting systems.
Single-page React app — pick a category, dial in wind/snow loads and
module count, see an indicative €/kWp figure in under a minute.

🔗 **Live:** https://derdienstag.github.io/Kostenrechner/

---

## Stack

- **Framework:** React 18 + Vite 5
- **Icons:** `lucide-react`
- **Styling:** CSS custom properties + scoped inline styles (no UI lib)
- **Persistence:** `localStorage` (config, country factors, language, admin session)
- **Deploy:** GitHub Actions → GitHub Pages

No backend, no API calls — everything runs in the browser.

---

## Getting started

Requirements: Node 20+, npm 10+.

```bash
git clone https://github.com/derDienstag/Kostenrechner.git
cd Kostenrechner
npm install
npm run dev          # → http://localhost:5173
```

### Scripts

| Command          | What it does                                            |
|------------------|---------------------------------------------------------|
| `npm run dev`    | Vite dev server with HMR                                |
| `npm run build`  | Production build into `dist/`                           |
| `npm run preview`| Serve the production build locally for a smoke test     |

---

## Repository layout

```
.
├── index.html                  # Vite entry — loads /src/main.jsx
├── public/
│   └── logo.png                # Static asset, copied as-is
├── src/
│   ├── main.jsx                # ReactDOM.createRoot
│   ├── App.jsx                 # Orchestrator: state + layout
│   ├── styles/global.css       # Design tokens + component styles
│   ├── components/             # UI components
│   │   ├── Header.jsx
│   │   ├── Icon.jsx
│   │   ├── SystemPicker.jsx
│   │   ├── SliderField.jsx
│   │   ├── Segmented.jsx
│   │   ├── LastenHelper.jsx    # PLZ → loads helper
│   │   ├── ResultCard.jsx      # €/kWp display
│   │   ├── BomPanel.jsx        # Material estimation
│   │   ├── AdminBackend.jsx
│   │   └── LoginModal.jsx
│   └── lib/                    # Pure logic, framework-free
│       ├── constants.js        # LS keys, admin hash, helpers
│       ├── config.js           # FALLBACK_CONFIG (pricing models)
│       ├── bom.js              # BOM_DATA + getBomEstimate()
│       ├── i18n.js             # German / English / Italian translations
│       ├── math.js             # evalPoly, interp1D
│       ├── pricing.js          # richtpreisProKwp(), indexConfig()
│       ├── useAnimatedNumber.js
│       └── loads/              # PLZ-based load lookup per country
│           ├── eurocode.js     # Shared qp(z) formula
│           ├── de.js           # DIN EN 1991
│           ├── at.js           # ÖNORM B 1991
│           ├── ch.js           # SIA 261
│           ├── it.js           # NTC 2018
│           └── index.js        # Dispatcher (lookupLoads, …)
├── docs/
│   ├── ARCHITECTURE.md         # How the parts fit together
│   ├── LOADS.md                # Eurocode / DIN / ÖNORM / SIA / NTC details
│   ├── DEPLOYMENT.md           # GitHub Pages + Actions setup
│   └── PHOTO_VISION_PLAN.md    # Future: roof image → config
└── .github/workflows/
    └── deploy.yml              # Build & deploy to Pages on push to main
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data-flow diagram
and component responsibilities.

---

## Configuration & data sources

### Pricing models

`src/lib/config.js` ships **`FALLBACK_CONFIG.models`** — one entry per
(category, system, klemmung, ausrichtung) combination. Each model is
either a polynomial fit (1-D in wind, or 2-D in wind+snow) or a flag
that forces a "Preis auf Anfrage" hand-off.

Models are generated upstream by an offline regression script. To update
them: open the app → press `🔒` (bottom-right) → log in → paste new JSON.

### Country price factors

Multiplicative uplift applied to the regression output. Edited via the
admin backend; default `1.00` for DE/AT/CH/IT, `0.95` for `OTHER`.

### Load lookup

PLZ-prefix tables map the first two digits of a postal code to
`[windZone, snowZone]`. From there, country-specific formulas
(`deCalcWind`, `chCalcSchnee`, …) apply the Eurocode/national-annex
math. See [`docs/LOADS.md`](docs/LOADS.md) for the formulas.

The values are **indicative only** — never substitutes for a structural
calculation.

---

## Admin access

Click the small lock icon in the bottom-right corner. Password is hashed
(SHA-256) in `src/lib/constants.js` as `ADMIN_PASSWORD_HASH`. Successful
sign-in stores a 4-hour session token in `localStorage`.

The backend lets you:
- Edit the model JSON (export current → tweak → re-import)
- Override country factors
- Reset everything to bundled defaults

All changes live in the user's browser — no server state.

---

## Deploy

Push to `main`. The `deploy.yml` workflow runs `npm ci && npm run build`
and publishes `dist/` to GitHub Pages via `actions/deploy-pages`.

Pages must be configured in *Settings → Pages → Source = "GitHub Actions"*.

---

## License

Proprietary — AEROCOMPACT GmbH.
