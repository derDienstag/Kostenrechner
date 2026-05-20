import { useEffect, useMemo, useState } from 'react';

import { Header }        from './components/Header.jsx';
import { Icon }          from './components/Icon.jsx';
import { SliderField }   from './components/SliderField.jsx';
import { LastenHelper }  from './components/LastenHelper.jsx';
import { SystemPicker }  from './components/SystemPicker.jsx';
import { ResultCard }    from './components/ResultCard.jsx';
import { BomPanel }      from './components/BomPanel.jsx';
import { AdminBackend }  from './components/AdminBackend.jsx';
import { LoginModal }    from './components/LoginModal.jsx';

import { FALLBACK_CONFIG }        from './lib/config.js';
import { T }                      from './lib/i18n.js';
import { getBomEstimate, BOM_DATA } from './lib/bom.js';
import { richtpreisProKwp, indexConfig } from './lib/pricing.js';
import {
  LS_KEYS, FALLBACK_COUNTRY_FACTORS, GROUND_SYSTEMS, clone,
} from './lib/constants.js';

/**
 * Top-level component. Owns every piece of mutable state, persists what
 * needs persisting to localStorage, and assembles the page from the
 * sub-components.
 *
 * The body is intentionally long but flat — there's no clever indirection
 * here, just one block of useState and one big return.
 */
export default function App() {
  // ── Language ─────────────────────────────────────────────────────
  const [lang, setLang] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_KEYS.lang);
      if (stored && T[stored]) return stored;
    } catch {}
    return 'de';
  });
  useEffect(() => { try { localStorage.setItem(LS_KEYS.lang, lang); } catch {} }, [lang]);
  const t = T[lang];

  // ── Admin session ────────────────────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.auth);
      if (!raw) return false;
      const { exp } = JSON.parse(raw);
      return exp && Date.now() < exp;
    } catch { return false; }
  });
  const [showLogin, setShowLogin] = useState(false);
  const [showBackend, setShowBackend] = useState(false);
  const doLogout = () => {
    localStorage.removeItem(LS_KEYS.auth);
    setIsAdmin(false);
    setShowBackend(false);
  };

  // ── Model config (overridable via backend) ───────────────────────
  const [config, setConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_KEYS.config);
      if (stored) return JSON.parse(stored);
    } catch {}
    return clone(FALLBACK_CONFIG);
  });
  useEffect(() => { try { localStorage.setItem(LS_KEYS.config, JSON.stringify(config)); } catch {} }, [config]);

  // ── Country factors (overridable via backend) ────────────────────
  const [countryFactors, setCountryFactors] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_KEYS.factors);
      if (stored) return JSON.parse(stored);
    } catch {}
    return clone(FALLBACK_COUNTRY_FACTORS);
  });
  useEffect(() => { try { localStorage.setItem(LS_KEYS.factors, JSON.stringify(countryFactors)); } catch {} }, [countryFactors]);

  const resetAll = () => {
    if (confirm(t.confirmReset)) {
      setConfig(clone(FALLBACK_CONFIG));
      setCountryFactors(clone(FALLBACK_COUNTRY_FACTORS));
    }
  };

  // ── Indexed config for fast lookup by the system pickers ─────────
  const idx = useMemo(() => indexConfig(config), [config]);
  const flatSystemKeys = Object.keys(idx.flat);
  // Hide " alpine" variants from the picker — they're a separate toggle.
  const flatSystemKeysVisible = flatSystemKeys.filter(s => !s.endsWith(' alpine'));

  // ── Configuration state ─────────────────────────────────────────
  const [category,         setCategory]        = useState('Flat');
  const [flatSystem,       setFlatSystem]      = useState(flatSystemKeys[0] || 'SN2');
  const [flatKlemmung,     setFlatKlemmung]    = useState('KSK');
  const [flatAusrichtung,  setFlatAusrichtung] = useState('Süd');
  const [pitchSystem,      setPitchSystem]     = useState(idx.pitch[0]?.system  || 'XM-F');
  const [metalSystem,      setMetalSystem]     = useState(idx.metal[0]?.system  || 'TS');
  const [groundSystem,     setGroundSystem]    = useState(GROUND_SYSTEMS[0].system);

  // Keep klemmung / ausrichtung valid when the user switches Flat system.
  useEffect(() => {
    const sys = idx.flat[flatSystem];
    if (!sys) return;
    if (!sys.klemmungen.includes(flatKlemmung))       setFlatKlemmung(sys.klemmungen[0]);
    if (!sys.ausrichtungen.includes(flatAusrichtung)) setFlatAusrichtung(sys.ausrichtungen[0]);
  }, [flatSystem, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const [windLoad,    setWindLoad]    = useState(0.5);
  const [snowLoad,    setSnowLoad]    = useState(1.0);
  const [country,     setCountry]     = useState('DE');
  const [modulePower, setModulePower] = useState(450);
  const [moduleCount, setModuleCount] = useState(100);
  const [discount,    setDiscount]    = useState(0);
  const [alpine,      setAlpine]      = useState(false);
  const [showBom,     setShowBom]     = useState(false);

  const hasAlpineVariant = sys => !!idx.flat[`${sys} alpine`];

  // ── Compute the result whenever any input changes ────────────────
  const result = useMemo(() => {
    // Resolve the effective system name (with alpine suffix if relevant).
    let sysName, ausrichtung, klemmung;
    if (category === 'Flat') {
      sysName    = (alpine && hasAlpineVariant(flatSystem)) ? `${flatSystem} alpine` : flatSystem;
      ausrichtung = flatAusrichtung;
      klemmung   = flatKlemmung;
    } else if (category === 'Pitch')  { sysName = pitchSystem;  ausrichtung = '—'; klemmung = '—'; }
    else if (category === 'Metal')    { sysName = metalSystem;  ausrichtung = '—'; klemmung = '—'; }
    else if (category === 'GROUND')   { sysName = groundSystem; ausrichtung = '—'; klemmung = '—'; }

    // Flat & ground roofs are insensitive to snow load (cost model only
    // varies in wind). Force the snow input to the 0.1 baseline so the
    // model is queried at its supported point.
    const effectiveSchnee = (category === 'Flat' || category === 'GROUND') ? 0.1 : snowLoad;

    const r = richtpreisProKwp({
      kategorie: category,
      system: sysName,
      ausrichtung, klemmung,
      wind: windLoad,
      schnee: effectiveSchnee,
      config, t,
    });

    if (r.preis == null) {
      return { ...r, totalKwp: (moduleCount * modulePower) / 1000 };
    }

    const cF = countryFactors[country] ?? 1.0;
    const dF = 1 - (discount / 100);
    const pricePerKwp = r.preis * cF * dF;
    const totalKwp    = (moduleCount * modulePower) / 1000;

    return {
      ...r,
      basePricePerKwp: r.preis,
      countryFactor:   cF,
      discountFactor:  dF,
      pricePerKwp,
      pricePerModule:  pricePerKwp * (modulePower / 1000),
      totalCost:       pricePerKwp * totalKwp,
      totalKwp,
      systemDisplay:   category === 'Flat' ? `${sysName} · ${klemmung} · ${ausrichtung}` : sysName,
    };
  }, [
    category, flatSystem, flatKlemmung, flatAusrichtung,
    pitchSystem, metalSystem, groundSystem, alpine,
    windLoad, snowLoad, country, modulePower, moduleCount, discount,
    config, countryFactors, lang,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pre-composed mailto URL for the "Anfrage senden" CTA ─────────
  const mailtoAnfrage = useMemo(() => {
    const sys = result.systemDisplay || category;
    const effectiveSchnee = category === 'Flat' ? 0.1 : snowLoad;
    const kwp = ((moduleCount * modulePower) / 1000).toFixed(2);
    const subject = encodeURIComponent(t.anfrageMailSubject(sys));
    const body    = encodeURIComponent(t.anfrageMailBody(
      sys,
      windLoad.toFixed(1),
      effectiveSchnee.toFixed(1),
      country, moduleCount, modulePower, kwp,
      result.meta?.grund || result.meta?.reason || '',
    ));
    return `mailto:projects.eu@aerocompact.com?subject=${subject}&body=${body}`;
  }, [result, category, windLoad, snowLoad, country, moduleCount, modulePower, t]);

  // ── BOM estimate ─────────────────────────────────────────────────
  // BOM tables are keyed slightly differently than pricing models —
  // some Flat systems separate KSK/LSK BOM but share pricing. Try the
  // "{system} {klemmung}" key first, fall back to bare system.
  const bomSysKey = useMemo(() => {
    if (category === 'Flat') {
      const sys = (alpine && hasAlpineVariant(flatSystem)) ? `${flatSystem} alpine` : flatSystem;
      const combo = `${sys} ${flatKlemmung}`;
      return BOM_DATA[combo] ? combo : sys;
    }
    if (category === 'Pitch')  return pitchSystem;
    if (category === 'Metal')  return metalSystem;
    if (category === 'GROUND') return groundSystem;
    return '';
  }, [category, flatSystem, flatKlemmung, pitchSystem, metalSystem, groundSystem, alpine]); // eslint-disable-line

  const bomEstimate = useMemo(() => {
    const schnee = (category === 'Flat' || category === 'GROUND') ? 0.1 : snowLoad;
    return getBomEstimate(bomSysKey, schnee, windLoad, moduleCount);
  }, [bomSysKey, category, snowLoad, windLoad, moduleCount]);

  // ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header
        lang={lang}
        onSetLang={setLang}
        isAdmin={isAdmin}
        showBackend={showBackend}
        onToggleBackend={() => setShowBackend(s => !s)}
        onLogout={doLogout}
        t={t}
      />

      {isAdmin && showBackend && (
        <AdminBackend
          config={config}
          onSetConfig={setConfig}
          countryFactors={countryFactors}
          onSetCountryFactors={setCountryFactors}
          onReset={resetAll}
          currentModel={result.meta?.m || null}
          systemDisplay={result.systemDisplay || category}
          t={t}
        />
      )}

      <div className="main-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 32px 80px' }}>
        <div className="main-cols" style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>

          {/* ── LEFT COLUMN — inputs ─────────────────────────────── */}
          <div className="left-col" style={{ flex: '0 0 57%', paddingRight: 36, borderRight: '1px solid var(--border)' }}>
            <div className="card">
              <SystemPicker
                t={t}
                idx={idx}
                category={category}                       setCategory={setCategory}
                flatSystem={flatSystem}                   setFlatSystem={setFlatSystem}
                flatKlemmung={flatKlemmung}               setFlatKlemmung={setFlatKlemmung}
                flatAusrichtung={flatAusrichtung}         setFlatAusrichtung={setFlatAusrichtung}
                pitchSystem={pitchSystem}                 setPitchSystem={setPitchSystem}
                metalSystem={metalSystem}                 setMetalSystem={setMetalSystem}
                groundSystem={groundSystem}               setGroundSystem={setGroundSystem}
                alpine={alpine}                           setAlpine={setAlpine}
                hasAlpineVariant={hasAlpineVariant}
                flatSystemKeysVisible={flatSystemKeysVisible}
              />

              {/* Section 2: Location & Loads */}
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)' }}>
                <div className="sec-hdr" style={{ marginBottom: 18 }}>
                  <Icon name="map-pin" size={13} style={{ color: 'var(--text3)' }}/>
                  {t.standortLasten}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <div className="lbl" style={{ marginBottom: 7 }}>{t.land}</div>
                    <select className="inp" value={country} onChange={e => setCountry(e.target.value)}>
                      {Object.keys(countryFactors).map(c => (
                        <option key={c} value={c}>{t.countries[c] || c}</option>
                      ))}
                    </select>
                  </div>

                  <LastenHelper
                    country={country}
                    onApply={(w, s) => { setWindLoad(w); setSnowLoad(s); }}
                    t={t}
                  />

                  <SliderField
                    label={t.windlast}
                    value={windLoad} min={0.1} max={3} step={0.1}
                    onChange={setWindLoad}
                    unit="kN/m²"
                    iconName="wind"
                  />

                  {(category === 'Pitch' || category === 'Metal') && (
                    <SliderField
                      label={t.schneelast}
                      value={snowLoad} min={0.1} max={4} step={0.1}
                      onChange={setSnowLoad}
                      unit="kN/m²"
                      iconName="snowflake"
                    />
                  )}

                  {category === 'Flat' && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 7,
                      padding: '9px 11px', borderRadius: 'var(--rad-sm)',
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                    }}>
                      <Icon name="info" size={12} style={{ color: 'var(--text3)', flexShrink: 0, marginTop: 1 }}/>
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {t.flatHinweis}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Module & Terms */}
              <div style={{ padding: '20px 24px 24px', borderTop: '1px solid var(--border)' }}>
                <div className="sec-hdr" style={{ marginBottom: 18 }}>
                  <Icon name="zap" size={13} style={{ color: 'var(--text3)' }}/>
                  {t.modulKonditionen}
                </div>
                <div className="module-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div>
                    <div className="lbl" style={{ marginBottom: 7 }}>{t.leistung}</div>
                    <input
                      type="number" className="inp num-inp"
                      value={modulePower}
                      onChange={e => setModulePower(Number(e.target.value))}
                      style={{ textAlign: 'left' }}
                    />
                  </div>
                  <div>
                    <div className="lbl" style={{ marginBottom: 7 }}>{t.anzahlModule}</div>
                    <input
                      type="number" className="inp num-inp"
                      value={moduleCount}
                      onChange={e => setModuleCount(Number(e.target.value))}
                      style={{ textAlign: 'left' }}
                    />
                  </div>
                  <div>
                    <div className="lbl" style={{ marginBottom: 7 }}>{t.rabatt}</div>
                    <input
                      type="number" min="0" max="100" className="inp num-inp"
                      value={discount}
                      onChange={e => setDiscount(Number(e.target.value))}
                      style={{ color: discount > 0 ? 'var(--cyan)' : 'var(--text)', textAlign: 'left' }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── RIGHT COLUMN — output ────────────────────────────── */}
          <div className="right-col" style={{ flex: 1, position: 'sticky', top: 64, paddingLeft: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>

            <ResultCard
              result={result}
              moduleCount={moduleCount}
              mailtoAnfrage={mailtoAnfrage}
              t={t}
            />

            <BomPanel
              open={showBom}
              onToggle={() => setShowBom(b => !b)}
              estimate={bomEstimate}
              systemDisplay={result.systemDisplay || bomSysKey}
              t={t}
            />

            {/* Disclaimer */}
            <div style={{ padding: '12px 14px', borderRadius: 'var(--rad-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 4 }}>
                {t.disclaimerTitle}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.55 }}>
                {t.disclaimerBody} {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Hidden lock icon, bottom-right, opens login modal */}
      {!isAdmin && (
        <button
          onClick={() => setShowLogin(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 40,
            width: 32, height: 32, borderRadius: '50%',
            border: '1px solid var(--border)', background: 'var(--surface)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.3, transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
          title="Admin"
        >
          <Icon name="lock" size={12} style={{ color: 'var(--text2)' }}/>
        </button>
      )}

      {showLogin && !isAdmin && (
        <LoginModal
          onSetAdmin={setIsAdmin}
          onSignedIn={() => { setShowLogin(false); setShowBackend(true); }}
          onClose={() => setShowLogin(false)}
          t={t}
        />
      )}
    </div>
  );
}
