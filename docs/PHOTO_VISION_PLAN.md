# Implementierungsplan: Foto → Konfiguration

Arbeitsanweisung für Subagents. Jede Task ist so geschrieben, dass ein frischer Agent (ohne Kontext aus dieser Session) sie ausführen kann. **Vor jeder Task** muss der Agent diesen Plan lesen.

---

## 0. Kontext für jeden Agent

**Repo:** AEROCOMPACT Kostenrechner. Single-file React-App, alles in `index.html` (~1550 Zeilen). React via Babel-Standalone, kein Build-Step. Static-Hosted.

**Ziel:** Ein Vertriebler lädt ein Dachfoto hoch (oder gibt eine Adresse ein). Das Tool erkennt automatisch:
- Dachtyp → Mapping auf Kategorie (Flat / Pitch / Metal / Ground)
- Geschätzte Modulzahl
- Ausrichtung (Süd / Ost-West)
- Optional: PLZ aus Adresse → triggert Lasten-Helper

Die erkannten Werte werden in die bestehenden Formularfelder geschrieben. Vertriebler korrigiert nach.

**Architektur:**
```
Browser (index.html)
   │  POST /analyze  { image: base64, address?: string }
   ▼
Cloudflare Worker (worker/)
   │  Anthropic API call mit Vision + Tool Use
   ▼
Claude Sonnet 4.6
   │  Strukturiertes JSON via Tool Use
   ▼
Worker → Browser → schreibt in React-State
```

**Warum Cloudflare Worker:** API-Key bleibt serverseitig, CORS sauber lösbar, Free-Tier reicht für Pilot, deploy via `wrangler` in <5 min.

**Kategorien-Mapping** (siehe `index.html` ab Zeile ~376):
- `Flat` → Flachdach, Systeme: S10, S10plus, SN2, SN2plus, S_BASEplus
- `Pitch` → Schrägdach, Systeme: XM-F (Ziegel), XT-R, XT-R mit Blechersatzziegel, XWS
- `Metal` → Metalldach (Trapez), Systeme: TL, TS, TLE, TSE, TR
- `GROUND` → Freifläche, Systeme: GS10plus, GS15

**Wichtige State-Variablen im React-Code** (im `Calculator`-Component, ab Zeile ~1012):
- `category` (`"Flat"|"Pitch"|"Metal"|"GROUND"`)
- `flatSystem`, `pitchSystem`, `metalSystem`, `groundSystem`
- `flatAusrichtung` (`"Süd"|"Ost/West"`)
- `flatKlemmung` (`"KSK"|"LSK"`)
- `moduleCount`, `modulePower`

---

## Phase 1 – Fundament (sequenziell, MUSS zuerst)

### Task 1.1 – Worker-Setup & Anthropic-Call

**Agent:** `general-purpose`, Sonnet 4.6
**Dauer:** ~45 min
**Abhängigkeiten:** keine
**Parallel zu:** 1.2, 1.3 (sobald Output-Schema steht — siehe 1.3 zuerst!)

**Auftrag:**
Erstelle einen Cloudflare Worker unter `worker/` mit:
- `wrangler.toml` (Worker-Name `kostenrechner-vision`)
- `src/index.ts` (oder `.js`) mit POST-Endpunkt `/analyze`
- Liest `image` (base64-String) und optional `address` aus dem JSON-Body
- Ruft Anthropic Messages API mit Claude Sonnet 4.6 (Modell-ID: `claude-sonnet-4-6`)
- Image als `content: [{type:"image", source:{type:"base64", media_type:"image/jpeg", data:...}}, {type:"text", text:...}]`
- Verwendet **Tool Use** mit dem Schema aus Task 1.3
- Gibt das Tool-Argument 1:1 als JSON zurück
- CORS-Header für `*` (später einschränken)
- API-Key aus `env.ANTHROPIC_API_KEY` (Worker Secret)

**Prompt-Caching aktivieren** für System-Prompt + Tool-Schema (`cache_control: {type: "ephemeral"}`).

**Deliverables:**
- `worker/wrangler.toml`
- `worker/src/index.ts`
- `worker/package.json` mit `wrangler` als devDependency
- `worker/README.md` mit Deploy-Anleitung: `wrangler secret put ANTHROPIC_API_KEY`, `wrangler deploy`

**Success criteria:**
- `curl -X POST <worker-url>/analyze -H "content-type: application/json" -d '{"image":"<base64>"}'` gibt JSON mit dem Tool-Schema zurück
- 4xx Error bei fehlendem `image`
- API-Key wird **nicht** im Code committed

**NICHT machen:** kein Frontend-Code anfassen.

---

### Task 1.2 – Frontend Modal-Scaffold (mit Mock-Daten)

**Agent:** `general-purpose`, Sonnet 4.6
**Dauer:** ~1 h
**Abhängigkeiten:** keine
**Parallel zu:** 1.1

**Auftrag:**
Erweitere `index.html` um ein Modal "Foto/Adresse analysieren":
- Button am Anfang der Sektion `Montagesystem` (oberhalb der Category-Tabs, vor Zeile ~1085 — suche nach `t.montagesystem` als Anker)
- Button-Label: `📷 Foto analysieren` (kein Emoji im Code — verwende `Icon name="camera"` analog zu bestehenden Icons)
- Onclick öffnet Modal (analog zum bestehenden Admin-Login-Modal — suche `adminLogin` als Vorlage für Struktur und Styling)

**Modal-Inhalt:**
- Zwei Tabs: "Foto" und "Adresse"
- Tab "Foto":
  - Drag-Drop-Zone + File-Input (`accept="image/*"`)
  - Preview des Bildes (max-height 200px)
  - Button "Analysieren" → ruft `analyzePhoto()` (zunächst Mock — siehe unten)
- Tab "Adresse":
  - Textfeld für Adresse
  - Button "Analysieren" → ruft `analyzeAddress()` (Mock)
- Während Analyse: Loading-Spinner mit Text "Bild wird analysiert..." (i18n via `t.analyseLaufend`)
- Bei Antwort: zeige strukturiertes Ergebnis (Kategorie, Modulzahl, Ausrichtung, Confidence) + "Übernehmen"-Button
- "Übernehmen" schließt Modal und ruft Callback `applyAnalysis(result)` → schreibt in die State-Variablen `setCategory`, `setFlatSystem` etc.

**Mock-Antwort** für jetzt:
```js
const MOCK_ANALYSIS = {
  roofType: "flat",
  category: "Flat",
  systemSuggestion: "SN2",
  ausrichtung: "Süd",
  klemmung: "KSK",
  estimatedModules: 80,
  modulePower: 450,
  confidence: 0.85,
  reasoning: "Erkannt: Flachdach, ~360 m², Süd-Ausrichtung möglich."
};
```

**i18n:** Neue Keys in `de`/`en`/`it` Locale-Objekten (Zeile ~687 ff):
- `fotoAnalyse`, `adresseAnalyse`, `analyseLaufend`, `confidenceLow`, `apply`, `dropPhoto`

**Deliverables:** Geänderte `index.html`

**Success criteria:**
- Modal öffnet/schließt sauber
- Datei-Upload zeigt Preview
- "Analysieren" zeigt nach 1s Mock-Antwort
- "Übernehmen" setzt Category auf "Flat", System auf SN2, Module auf 80 — sichtbar im UI
- Funktioniert in allen 3 Sprachen (DE/EN/IT)

**NICHT machen:** kein echter API-Call. Worker-URL ist noch nicht bekannt.

---

### Task 1.3 – Prompt + Tool-Schema-Design (Artefakt)

**Agent:** `claude-api`, Opus 4.7 (kritisch für Qualität)
**Dauer:** ~1 h
**Abhängigkeiten:** keine — MUSS aber zuerst fertig sein, bevor 1.1 deployed wird
**Parallel zu:** 1.1, 1.2

**Auftrag:**
Entwirf das Tool-Use-Schema und den System-Prompt für die Vision-Analyse. Ergebnis als Datei `worker/prompt.ts` (oder JSON), die von 1.1 importiert wird.

**Tool-Schema (Input für Claude Tool Use):**
```ts
{
  name: "report_roof_analysis",
  description: "Berichte die Dachanalyse strukturiert.",
  input_schema: {
    type: "object",
    required: ["category", "confidence", "reasoning"],
    properties: {
      category: { enum: ["Flat", "Pitch", "Metal", "GROUND"] },
      pitchedSubtype: { enum: ["ziegel", "blech", "schiefer", "unklar"] },
      systemSuggestion: { type: "string", description: "z.B. SN2, XM-F, TL" },
      ausrichtung: { enum: ["Süd", "Ost/West", "andere"] },
      klemmung: { enum: ["KSK", "LSK"] },
      estimatedAreaM2: { type: "number" },
      estimatedModules: { type: "integer" },
      orientation_degrees: { type: "number", description: "Azimut, 180 = Süd" },
      obstructions: { type: "array", items: { type: "string" } },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      reasoning: { type: "string", maxLength: 300 }
    }
  }
}
```

**System-Prompt** (Deutsch, ~400-500 Tokens):
- Rolle: Solar-Mounting-Berater bei AEROCOMPACT
- Erkläre die 4 Kategorien + die wählbaren Systeme pro Kategorie (Liste aus Task 0)
- Heuristiken:
  - Flachdach + Süd → meist S10/SN2
  - Flachdach + Ost-West (groß) → S10plus/SN2plus
  - Ziegeldach → XM-F
  - Metalldach mit Trapez → TS oder TL
  - Freifläche → GS10plus
- Modulzahl-Schätzung: ~5 m²/Modul bei 450 Wp, abzüglich 30% Sicherheitsabstand
- Bei Unsicherheit: confidence < 0.7 setzen, im `reasoning` erklären warum

**Test-Fälle** (3-5 Beispiel-Bilder als URLs oder lokale Pfade in `worker/test-fixtures/`):
- Klares Flachdach Industriehalle
- Einfamilienhaus mit Ziegeldach Süd
- Metalldach mit Trapezblech
- Freifläche
- Ambiguous case (z.B. Foto von unten, Dach kaum sichtbar) → soll confidence < 0.5 liefern

**Deliverables:**
- `worker/prompt.ts` — exportiert `SYSTEM_PROMPT`, `TOOL_SCHEMA`
- `worker/test-fixtures/` mit 5 Test-Bildern + erwarteten Outputs in `expected.json`
- `worker/README.md` ergänzt um "Prompt-Iteration"-Sektion

**Success criteria:**
- Tool-Schema validiert gegen Anthropic API (kein 400 Bad Request)
- Bei den 5 Test-Bildern liefert das Modell sinnvolle Kategorien
- Confidence ist kalibriert (niedrig bei schlechten Bildern)

---

## Phase 2 – Integration (sequenziell)

### Task 2.1 – Worker + Frontend verbinden

**Agent:** `general-purpose`, Sonnet 4.6
**Dauer:** ~45 min
**Abhängigkeiten:** 1.1, 1.2, 1.3 müssen abgeschlossen sein

**Auftrag:**
- In `index.html`: Mock durch echten `fetch()`-Call zum Worker ersetzen
- Worker-URL als Konstante `VISION_WORKER_URL` oben in der Datei (Default: `https://kostenrechner-vision.<account>.workers.dev`)
- Bild vor dem Senden auf max. 1024px lange Seite skalieren (Canvas-API) — spart Tokens
- Error-Handling: Netzwerkfehler, 5xx, 400 (kein Bild)
- Timeout 30s

**Deliverables:** Geänderte `index.html`

**Success criteria:**
- Echtes Foto wird hochgeladen, Worker antwortet, Werte erscheinen im Modal
- Bei Netzwerkfehler: verständliche Fehlermeldung
- Worker-URL ist konfigurierbar (für lokale Worker-Entwicklung)

---

### Task 2.2 – Field-Mapping + Confidence-UI

**Agent:** `general-purpose`, Sonnet 4.6
**Dauer:** ~1 h
**Abhängigkeiten:** 2.1

**Auftrag:**
- Wenn "Übernehmen" geklickt wird:
  1. Setze `category`, dann (mit `setTimeout(0)` falls nötig wegen Reihenfolge) den system-State (`setFlatSystem`/`setMetalSystem` etc.)
  2. Setze `flatAusrichtung`, `flatKlemmung`, `moduleCount`
  3. Felder, die durch KI gesetzt wurden, kurz **gelb pulsen** (CSS-Animation, ~2s) — analog zur bestehenden `fade-up`-Klasse; neue Klasse `.ai-set` mit Keyframes
- Confidence < 0.7: Banner über dem Ergebnis "⚠️ Niedrige Confidence — bitte Werte prüfen" (Icon `alert-triangle`)
- Confidence ≥ 0.7: Grüner Hinweis "Werte mit hoher Konfidenz erkannt"
- Das `reasoning`-Feld als kleines, kursives Zitat unter den Werten anzeigen

**Deliverables:** Geänderte `index.html`

**Success criteria:**
- Übernehmen-Klick schreibt korrekt in alle State-Variablen
- Pulsing-Animation läuft, ist nach 2s weg
- Confidence-Banner zeigt sich kontextabhängig

---

## Phase 3 – Adress-Modus (optional, separat releasebar)

### Task 3.1 – Static-Maps-Integration

**Agent:** `general-purpose`, Sonnet 4.6
**Dauer:** ~1 h
**Abhängigkeiten:** 2.2

**Auftrag:**
- Im Worker: wenn `address` statt `image` kommt:
  1. Geocoding via Mapbox API (`MAPBOX_TOKEN` als zweites Worker-Secret) → Lat/Lng + PLZ
  2. Hole Satellitenbild via Mapbox Static Images API (z.B. 1024×1024, zoom 19, satellite-v9)
  3. Schicke dieses Bild durch dieselbe Pipeline wie Foto-Upload
  4. Antwort um `extractedPLZ` erweitern
- Im Frontend:
  - Adress-Tab wird funktional
  - Nach Übernehmen: `extractedPLZ` triggert Lasten-Helper-PLZ-Feld
  - Bild aus Worker-Response (als Data-URL) im Modal als Vorschau anzeigen

**Deliverables:**
- `worker/src/index.ts` erweitert
- `worker/README.md` ergänzt um Mapbox-Setup
- `index.html` erweitert

**Success criteria:**
- "Berliner Allee 49, München" → Modal zeigt Satellitenbild + analysierte Werte + PLZ 80809 wird in Lasten-Helper übernommen
- Mapbox-Free-Tier reicht für Pilot

**Tradeoff-Notiz:** Mapbox Free Tier = 50k Geocoding-Calls + 50k Map-Loads/Monat. Locker.

---

## Phase 4 – Härtung (vor Production-Release)

### Task 4.1 – Rate-Limiting + Spend-Schutz

**Agent:** `general-purpose`, Sonnet 4.6
**Dauer:** ~30 min
**Abhängigkeiten:** 2.2

**Auftrag:**
- Worker: Rate-Limit pro IP (z.B. 20 Requests/h) via Cloudflare KV oder Durable Object
- CORS auf Production-Domain einschränken (nicht mehr `*`)
- Anthropic Spend-Limit im Dashboard auf 50 €/Monat setzen (manuell, nicht im Code)

---

### Task 4.2 – Privacy-Hinweis + DSGVO

**Agent:** `general-purpose`, Sonnet 4.6
**Dauer:** ~30 min
**Abhängigkeiten:** keine

**Auftrag:**
- Im Modal: kleiner Hinweistext "Bild wird zur Analyse an Anthropic gesendet. Keine dauerhafte Speicherung."
- Verlinke Anthropic-Privacy-Policy
- Falls echte Endkunden-Adressen: Hinweis dass nur PLZ-Bereich verwendet wird, Adresse nicht gespeichert wird

---

## Reihenfolge & Parallelisierung

```
Phase 1 (parallel möglich nach 1.3-Schema):
   ├── 1.3 Prompt+Schema  ──┐
   ├── 1.1 Worker           ├── alle 3 parallel startbar,
   └── 1.2 Frontend Mock  ──┘   aber 1.1 braucht 1.3-Schema

Phase 2 (sequenziell):
   └── 2.1 Verbindung → 2.2 Mapping/UI

Phase 3 (optional):
   └── 3.1 Adress-Modus

Phase 4 (vor Release):
   ├── 4.1 Rate-Limit
   └── 4.2 Privacy
```

**Empfohlener Ablauf:**
1. **Erste Session:** Task 1.3 (Opus), dann parallel 1.1 + 1.2 (zwei Sonnet-Subagents in einer Message)
2. **Zweite Session:** Task 2.1 + 2.2 (Sonnet, sequenziell)
3. **Dritte Session:** Task 3.1 (Sonnet) — wenn Adress-Modus gewünscht
4. **Vierte Session:** 4.1 + 4.2 vor Production

---

## Definition of Done (Pilot)

- [ ] Worker deployed, API-Key als Secret
- [ ] Modal in `index.html` integriert, alle 3 Sprachen
- [ ] 5 Test-Fotos liefern plausible Ergebnisse
- [ ] Confidence-UI funktioniert
- [ ] Adress-Modus funktioniert (Phase 3)
- [ ] Rate-Limit aktiv (Phase 4)
- [ ] Spend-Limit gesetzt
- [ ] Privacy-Hinweis sichtbar
- [ ] Auf Production deployed, Vertrieb informiert

---

## Hinweise für alle Subagents

- **Code-Stil:** keine Kommentare außer bei nicht-offensichtlicher Logik. Keine Emojis im Code. Verwende `Icon`-Component (bereits vorhanden) statt Unicode-Symbolen.
- **i18n:** Jeder neue String muss in `de`, `en`, `it` (Zeilen ~687-689 in `index.html`).
- **localStorage:** Wenn neue persistente Daten — `LS_*`-Konstante mit Versions-Suffix anlegen (Pattern existiert).
- **Branch:** Pro Phase ein eigener Branch (`feat/photo-vision-phase-1` usw.), PR gegen `main`.
- **Testing:** Vor Push immer im Browser durchklicken. Bei UI-Änderungen Screenshots.
- **Was NICHT tun:** Bestehende Calc-Logik (`richtpreisProKwp`, BOM-Daten) nicht anfassen. Modell-Mathematik ist out-of-scope.
