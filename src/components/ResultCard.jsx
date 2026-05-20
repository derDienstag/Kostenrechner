import { Icon } from './Icon.jsx';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';

/**
 * Result panel — shows the headline €/kWp number along with per-module
 * and total cost. Switches to an "on request" layout when the model
 * returned `status === 'anfrage'` or `'unbekannt'`.
 *
 * Numbers are smoothly tweened so the figure counts up as the user
 * drags sliders.
 *
 * @param {object} props
 * @param {object} props.result        Output of `richtpreisProKwp(...)`.
 * @param {number} props.moduleCount
 * @param {string} props.mailtoAnfrage Pre-composed mailto: URL.
 * @param {object} props.t
 */
export function ResultCard({ result, moduleCount, mailtoAnfrage, t }) {
  const animKwp      = useAnimatedNumber(result.totalKwp     || 0);
  const animPriceKwp = useAnimatedNumber(result.pricePerKwp  || 0);
  const animTotal    = useAnimatedNumber(result.totalCost    || 0);

  /** Locale-independent integer formatter — €/kWp values are rounded. */
  const fmt = n => new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

  const isAnfrage  = result.status === 'anfrage';
  const isUnknown  = result.status === 'unbekannt';

  return (
    <div className="card" style={{ borderTop: '2px solid var(--cyan)', borderRadius: 'var(--rad)' }}>
      <div style={{ padding: '24px' }}>

        {/* ── On-request / unknown state ── */}
        {(isAnfrage || isUnknown) && (
          <div className="fade-up">
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: isAnfrage ? 'var(--amber)' : 'var(--err)',
              marginBottom: 12,
            }}>
              {isAnfrage ? t.preisAufAnfrage : t.modellNichtVerfuegbar}
            </div>

            {(result.meta?.grund || result.meta?.reason) && (
              <p style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', marginBottom: 6 }}>
                {result.meta?.grund || result.meta?.reason}
              </p>
            )}
            <p style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 16 }}>
              {t.bitteVertriebAnfragen}
            </p>

            <a
              href={mailtoAnfrage}
              style={anfrageBtn}
              onMouseEnter={e => { e.currentTarget.style.background = 'oklch(74% 0.14 72 / 0.18)'; e.currentTarget.style.borderColor = 'oklch(74% 0.14 72 / 0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--amber-dim)';          e.currentTarget.style.borderColor = 'oklch(74% 0.14 72 / 0.35)'; }}
            >
              <Icon name="mail" size={13}/>{t.anfrageSenden}
            </a>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="lbl" style={{ marginBottom: 7 }}>{t.totalKwp}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 500, color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(result.totalKwp || 0)} kWp
              </div>
            </div>
          </div>
        )}

        {/* ── Normal result ── */}
        {result.preis != null && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Headline: €/kWp */}
            <div>
              <div className="lbl" style={{ marginBottom: 9 }}>{t.kostenProKwp}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 48, fontWeight: 600, color: 'var(--cyan)',
                  lineHeight: 1, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums',
                }}>
                  {fmt(animPriceKwp)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>€/kWp</span>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }}/>

            {/* Per module */}
            <div>
              <div className="lbl" style={{ marginBottom: 7 }}>
                {t.kostenProModul} · {moduleCount} {t.moduleLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={subValue}>{fmt(result.pricePerModule)}</span>
                <span style={subUnit}>€</span>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)' }}/>

            {/* Total */}
            <div>
              <div className="lbl" style={{ marginBottom: 7 }}>
                {t.gesamtkosten} · {fmt(animKwp)} kWp
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={subValue}>{fmt(animTotal)}</span>
                <span style={subUnit}>€</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

const subValue = {
  fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 500, color: 'var(--text)',
  lineHeight: 1, fontVariantNumeric: 'tabular-nums',
};
const subUnit = { fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' };

const anfrageBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 16px', borderRadius: 'var(--rad-sm)',
  background: 'var(--amber-dim)', border: '1px solid oklch(74% 0.14 72 / 0.35)',
  color: 'var(--amber)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
  textDecoration: 'none', cursor: 'pointer', transition: 'all 0.12s', marginBottom: 20,
};
