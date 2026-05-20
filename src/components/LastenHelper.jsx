import { useEffect, useState } from 'react';
import { Icon } from './Icon.jsx';
import { lookupLoads, SUPPORTED_COUNTRIES, getPlzMeta } from '../lib/loads/index.js';

/**
 * Collapsible "look up loads by PLZ" helper.
 *
 * Renders only for countries with a load lookup table (DE, AT, CH, IT).
 * Resets its state whenever the country changes.
 *
 * Inputs: PLZ/CAP prefix, terrain category (Geländekategorie), building
 * reference height, site elevation. On a successful lookup it shows the
 * resulting wind/snow zone and the computed loads — and offers an
 * "Übernehmen" button that pipes the values back to the parent.
 *
 * @param {object} props
 * @param {string} props.country  ISO 2-letter country code.
 * @param {(wind:number, snow:number)=>void} props.onApply
 * @param {object} props.t        i18n table.
 */
export function LastenHelper({ country, onApply, t }) {
  const [open, setOpen]       = useState(false);
  const [plz, setPlz]         = useState('');
  const [gk, setGk]           = useState('III');
  const [gebHoehe, setGeb]    = useState(10);
  const [hoeheNN, setNN]      = useState(300);
  const [result, setResult]   = useState(null);
  const [notFound, setNotFnd] = useState(false);

  // Reset whenever the user switches country.
  useEffect(() => {
    setResult(null);
    setPlz('');
    setNotFnd(false);
  }, [country]);

  // Re-run the lookup whenever any input changes.
  useEffect(() => {
    const r = lookupLoads(country, plz, gk, gebHoehe, hoeheNN);
    if (r === null)         { setResult(null); setNotFnd(false); }
    else if (r === 'unknown') { setResult(null); setNotFnd(true);  }
    else                     { setResult(r);    setNotFnd(false); }
  }, [plz, gk, gebHoehe, hoeheNN, country]);

  if (!SUPPORTED_COUNTRIES.includes(country)) return null;

  const { len: plzLen, ph: plzPh } = getPlzMeta(country);
  const hinweis = {
    DE: t.lasthinweis, AT: t.lasthinweisAT, CH: t.lasthinweisCH, IT: t.lasthinweisIT,
  }[country] || t.lasthinweis;

  return (
    <div>
      {/* Collapse toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '6px 10px', borderRadius: 'var(--rad-sm)',
          border: '1px solid var(--border)',
          background: open ? 'var(--surface2)' : 'transparent',
          color: 'var(--text3)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'var(--sans)', transition: 'all 0.12s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="map-pin" size={12}/>{t.lastenhilfe}
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={12}/>
      </button>

      {/* Expanded panel */}
      {open && (
        <div
          className="fade-up"
          style={{
            marginTop: 8, padding: '13px 13px 11px', borderRadius: 'var(--rad-sm)',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 9,
          }}
        >
          {/* PLZ + GK */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
            <div>
              <div className="lbl" style={{ marginBottom: 4 }}>{t.plzLabel}</div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={plzLen}
                className="inp"
                placeholder={plzPh}
                value={plz}
                onChange={e => setPlz(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div>
              <div className="lbl" style={{ marginBottom: 4 }}>{t.gelaendekategorieLabel}</div>
              <select className="inp" value={gk} onChange={e => setGk(e.target.value)}>
                <option value="I">{t.gkOptI}</option>
                <option value="II">{t.gkOptII}</option>
                <option value="III">{t.gkOptIII}</option>
                <option value="IV">{t.gkOptIV}</option>
              </select>
            </div>
          </div>

          {/* Heights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div className="lbl" style={{ marginBottom: 4 }}>{t.gebHoeheLabel}</div>
              <input
                type="number" min={3} max={100} className="inp num-inp"
                value={gebHoehe}
                onChange={e => setGeb(Math.max(3, Number(e.target.value)))}
              />
            </div>
            <div>
              <div className="lbl" style={{ marginBottom: 4 }}>{t.hoeheNNLabel}</div>
              <input
                type="number" min={0} max={3000} className="inp num-inp"
                value={hoeheNN}
                onChange={e => setNN(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          {notFound && (
            <p style={{ fontSize: 12, color: 'var(--err)', margin: 0 }}>
              {t.plzUnbekannt}
            </p>
          )}

          {result && (
            <div style={{
              padding: '9px 11px', borderRadius: 'var(--rad-sm)',
              background: 'var(--cyan-dim)', border: '1px solid var(--cyan-mid)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {t.windzoneLabel} <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text)' }}>{result.wz}</span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {t.schneezoneLabel} <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text)' }}>{result.sz}</span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    Wind <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--cyan)' }}>{result.wind} kN/m²</span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    Schnee <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--cyan)' }}>{result.snow} kN/m²</span>
                  </span>
                </div>
                <button
                  onClick={() => { onApply(result.wind, result.snow); setOpen(false); }}
                  style={{
                    padding: '5px 12px', borderRadius: 'var(--rad-sm)', cursor: 'pointer',
                    background: 'var(--cyan)', color: 'var(--bg)', border: 'none',
                    fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)', flexShrink: 0,
                  }}
                >
                  {t.uebernehmen}
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', margin: '6px 0 0', fontStyle: 'italic' }}>
                {hinweis}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
