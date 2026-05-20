import { useState } from 'react';
import { Icon } from './Icon.jsx';

/**
 * Admin backend panel.
 *
 * Two side-by-side cards:
 *   1. JSON editor for the model config (export current → edit → import).
 *   2. Editable table of country price-factors.
 *
 * When a price is currently being computed, a third card shows the
 * underlying model metadata (R², ranges, anfrage thresholds, …) so the
 * admin can verify which regression is in effect.
 *
 * @param {object} props
 * @param {object} props.config
 * @param {(c:object)=>void} props.onSetConfig
 * @param {object} props.countryFactors
 * @param {(f:object)=>void} props.onSetCountryFactors
 * @param {()=>void} props.onReset
 * @param {object|null} props.currentModel    Currently-active model meta.
 * @param {string} props.systemDisplay        Label for the active model.
 * @param {object} props.t
 */
export function AdminBackend({
  config, onSetConfig,
  countryFactors, onSetCountryFactors,
  onReset, currentModel, systemDisplay, t,
}) {
  const [draft,   setDraft]   = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  function exportConfig() {
    setDraft(JSON.stringify(config, null, 2));
    setError(''); setSuccess('');
  }

  function importConfig() {
    try {
      const parsed = JSON.parse(draft);
      if (!parsed.models || typeof parsed.models !== 'object') {
        throw new Error(t.expectModels);
      }
      onSetConfig(parsed);
      setError('');
      setSuccess(t.modelleImportiert(Object.keys(parsed.models).length));
    } catch (err) {
      setError(`${t.jsonError} ${err.message}`);
      setSuccess('');
    }
  }

  return (
    <section
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
        padding: '24px 32px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="sec-hdr">
            <Icon name="database" size={13} style={{ color: 'var(--text3)' }}/>
            {t.backendTitle}
          </div>
          <button className="btn btn-ghost" onClick={onReset} style={{ fontSize: 10, gap: 4 }}>
            <Icon name="rotate-ccw" size={11}/> {t.zuruecksetzen}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* JSON editor */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{t.modellKonfig}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost"   onClick={exportConfig}                style={btnSm}>
                  <Icon name="download" size={11}/>{t.aktuellLaden}
                </button>
                <button className="btn btn-primary" onClick={importConfig} disabled={!draft} style={btnSm}>
                  <Icon name="upload"   size={11}/>{t.importieren}
                </button>
              </div>
            </div>
            <textarea
              value={draft}
              onChange={e => { setDraft(e.target.value); setError(''); setSuccess(''); }}
              placeholder={t.jsonPlaceholder}
              style={{ height: 150 }}
            />
            {error   && <p style={{ color: 'var(--err)',              fontSize: 11, marginTop: 6 }}>{error}</p>}
            {success && <p style={{ color: 'oklch(70% 0.15 145)',     fontSize: 11, marginTop: 6 }}>{success}</p>}
            <p style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 8 }}>
              {config.meta?.stand || '—'} · {Object.keys(config.models).length} {t.modelleAktiv}
            </p>
          </div>

          {/* Country factors */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>
              {t.laenderfaktoren}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left' }}>{t.land}</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Faktor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(countryFactors).map(([code, val]) => (
                  <tr key={code} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 0', fontSize: 12, color: 'var(--text2)' }}>{code}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right' }}>
                      <input
                        type="number" step="0.01"
                        className="num-inp"
                        style={{ width: 80, fontSize: 13 }}
                        value={val}
                        onChange={e => onSetCountryFactors({
                          ...countryFactors,
                          [code]: parseFloat(e.target.value) || 0,
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 10, fontFamily: 'var(--mono)' }}>
              {t.laenderfaktorenSub}
            </p>
          </div>
        </div>

        {/* Active model metadata */}
        {currentModel && (
          <div className="card" style={{ padding: 20, marginTop: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>
              {t.aktuellesModell} <span style={{ color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>{systemDisplay}</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                [t.modelltyp,    currentModel.type],
                [t.windRange,    currentModel.wind_range ? `[${currentModel.wind_range}]` : '—'],
                [t.snowRange,    currentModel.snow_range ? `[${currentModel.snow_range}]` : t.fixSnow],
                ['R²',           currentModel.r_squared ?? currentModel.wind_r_squared ?? '—'],
                [t.anfrageWind,    currentModel.wind_anfrage_threshold != null ? `≥ ${currentModel.wind_anfrage_threshold}` : '—'],
                [t.anfrageSchnee,  currentModel.snow_anfrage_threshold != null ? `≥ ${currentModel.snow_anfrage_threshold}` : '—'],
                ['RMSE',         currentModel.rmse ?? '—'],
                [t.datenpunkte,  currentModel.n_data_points ?? '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                    {k}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const btnSm = { fontSize: 10, padding: '4px 9px', gap: 3 };
const thStyle = {
  fontSize: 10, color: 'var(--text3)', paddingBottom: 8,
  textTransform: 'uppercase', letterSpacing: '0.08em',
};
