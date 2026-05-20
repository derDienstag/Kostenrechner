# Load lookup — Eurocode et al.

The PLZ-based load lookup is a convenience for users who don't have
zone numbers and elevations handy. The output is **indicative only** —
zone boundaries don't follow PLZ borders, and a structural calculation
always trumps the helper.

## Wind: shared Eurocode formula

All four supported countries (DE, AT, CH, IT) follow the EN 1991-1-4
peak-velocity-pressure approach. We compute

```
qp(z) = [1 + 7 / ln(z_eff / z0)] · kr² · ln²(z_eff / z0) · qb
```

where

- `qb` — basic velocity pressure, set by the national wind-zone table
- `z` — reference height above ground (user input)
- `z_eff = max(z, z_min)` — protects against unrealistically low values
- `z0`, `z_min` — terrain-category roughness length and floor
- `kr = 0.19 · (z0 / 0.05)^0.07` — terrain factor

The shared implementation lives in `src/lib/loads/eurocode.js`:

```js
qpZ(qb, gk, z)  // → rounded kN/m²
```

### Terrain categories (Geländekategorien)

Per Tab. 4.1 of EN 1991-1-4:

| GK   | z0 [m] | z_min [m] | Description                            |
|------|--------|-----------|----------------------------------------|
| I    | 0.01   | 2         | Sea, coast, lake shore, islands        |
| II   | 0.05   | 4         | Open country, low vegetation           |
| III  | 0.30   | 8         | Suburbs, forest edges                  |
| IV   | 1.00   | 16        | Urban, inner city                      |

### Country-specific qb [kN/m²]

| Zone | DE   | AT   | CH   | IT   |
|------|------|------|------|------|
| 1    | 0.32 | 0.30 | 0.30 | 0.32 |
| 2    | 0.39 | 0.39 | 0.40 | 0.45 |
| 3    | 0.48 | 0.48 | 0.55 | 0.56 |
| 4    | 0.56 | —    | —    | —    |

Source: respective national annexes (DIN, ÖNORM, SIA 261, NTC 2018).

## Snow: per-country formulas

Snow scaling depends on national tradition — DE/AT/IT use quadratic
forms in elevation, CH uses H^1.5 (alpine snow scales more aggressively).
Floors are always applied; the formulas are:

### Germany — DIN EN 1991-1-3/NA

`t = (H + 140) / 760`, then `sk = a + b·t²`, floor = `0.65`.

| Zone | a    | b    |
|------|------|------|
| 1    | 0.19 | 0.91 |
| 1a   | 0.25 | 1.91 |
| 2    | 0.25 | 1.06 |
| 2a   | 0.31 | 2.91 |
| 3    | 0.31 | 2.91 |

### Austria — ÖNORM B 1991-1-3

`sk = a + b·(H/1000)²`.

| Zone | a    | b    | floor |
|------|------|------|-------|
| 1    | 0.70 | 0.50 | 0.70  |
| 2    | 0.85 | 1.20 | 0.85  |
| 3    | 1.50 | 2.50 | 1.50  |

### Switzerland — SIA 261

`sk = a + b · (H/1000)^1.5`.

| Zone | a    | b    | floor |
|------|------|------|-------|
| 1    | 0.70 | 1.80 | 0.90  |
| 2    | 1.00 | 2.50 | 1.20  |
| 3    | 2.00 | 3.50 | 2.50  |

### Italy — NTC 2018 (simplified)

`sk = a + b·(H/1000)²`.

| Zone | a    | b    | floor |
|------|------|------|-------|
| 1    | 0.40 | 0.50 | 0.40  |
| 2    | 0.60 | 1.50 | 0.60  |
| 3    | 1.20 | 3.00 | 1.20  |

## PLZ → zone tables

The 2-digit PLZ prefix is the lookup key. Tables are built once at
module load (IIFE inside `DE_PLZ_ZONES = (() => {...})()`).

Coverage:

- **DE**: 00–99 (full territory, including Sylt, Allgäu, Erzgebirge)
- **AT**: 10–99 (Bundesland-level; pannonic plain, alpine, Föhn zones)
- **CH**: 10–99 (cantonal granularity; Föhn-Rheintal flagged WZ3)
- **IT**: 00–99 (all 20 regions + Sardinia + Sicily)

When the prefix isn't mapped, the helper shows
"PLZ-Region nicht erkannt" / "CAP non trovato" and falls back to the
manual slider inputs.

## Adding a new country

1. Create `src/lib/loads/xx.js` with:
   - `XX_PLZ_ZONES` — `{ "12": [wz, sz], ... }`
   - `xxCalcWind(wz, gk, z)` — usually a one-liner delegating to `qpZ`
   - `xxCalcSchnee(sz, altNN)`
2. Register the bundle in `src/lib/loads/index.js`:
   ```js
   XX: { table: XX_PLZ_ZONES, wind: xxCalcWind, snow: xxCalcSchnee,
         plzLen: 5, plzPh: 'e.g. 12345' },
   ```
3. Add `XX` to `FALLBACK_COUNTRY_FACTORS` in `constants.js`.
4. Add `XX: "<country name>"` to every language's `countries` object
   in `i18n.js`, plus a `lasthinweisXX` line.
5. The UI updates automatically.
