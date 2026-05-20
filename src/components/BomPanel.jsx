import { Icon } from './Icon.jsx';

/**
 * Material-estimate (Bill of Materials) panel.
 *
 * Collapsible. When open, renders a table of (Art.-Nr., description,
 * qty) rows plus a CSV-export button. The hint text below explains
 * that the numbers are linearly scaled from the reference installation.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onToggle
 * @param {{artnr:string, bez:string, qty:number}[] | null} props.estimate
 * @param {string} props.systemDisplay  Used in the CSV filename.
 * @param {object} props.t
 */
export function BomPanel({ open, onToggle, estimate, systemDisplay, t }) {
  return (
    <div className="card" style={{ borderRadius: 'var(--rad)', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="package" size={13} style={{ color: 'var(--text3)' }}/>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text2)' }}>
            {t.materialschaetzung}
          </span>
          {estimate && !open && (
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              ({estimate.length})
            </span>
          )}
        </div>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={12} style={{ color: 'var(--text3)', flexShrink: 0 }}/>
      </button>

      {open && (
        <div style={{ padding: '0 20px 18px' }}>
          {!estimate ? (
            <p style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', margin: 0 }}>
              {t.keineBomDaten}
            </p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={th}>{t.colArtnr}</th>
                    <th style={{ ...th, paddingLeft: 10 }}>{t.colBez}</th>
                    <th style={{ ...th, textAlign: 'right' }}>{t.colAnzahl}</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid oklch(100% 0 0 / 0.04)' }}>
                      <td style={tdArt}>{item.artnr}</td>
                      <td style={tdBez}>{item.bez}</td>
                      <td style={tdQty}>{item.qty.toLocaleString('de-DE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 14, gap: 10 }}>
                <p style={{ fontSize: 10, color: 'var(--text3)', margin: 0, lineHeight: 1.55, fontStyle: 'italic', flex: 1 }}>
                  {t.materialHinweis}
                </p>
                <button
                  title="CSV Export"
                  onClick={() => downloadCsv(estimate, systemDisplay, t)}
                  style={csvBtn}
                >
                  <Icon name="download" size={10}/>CSV
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const th = {
  textAlign: 'left', paddingBottom: 7, fontSize: 10, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)',
  whiteSpace: 'nowrap',
};
const tdArt = {
  padding: '5px 0', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)',
  verticalAlign: 'middle', whiteSpace: 'nowrap',
};
const tdBez = {
  padding: '5px 10px', fontSize: 11, color: 'var(--text2)',
  verticalAlign: 'middle', lineHeight: 1.4,
};
const tdQty = {
  padding: '5px 0', textAlign: 'right', fontSize: 12, fontFamily: 'var(--mono)',
  fontWeight: 600, color: 'var(--text)', verticalAlign: 'middle',
};
const csvBtn = {
  flexShrink: 0, padding: '5px 10px', borderRadius: 'var(--rad-sm)',
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text3)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
  letterSpacing: '0.06em', textTransform: 'uppercase',
  display: 'flex', alignItems: 'center', gap: 5,
};

/** Build and trigger download of a UTF-8 BOM-prefixed CSV. */
function downloadCsv(estimate, name, t) {
  const rows = [
    [t.colArtnr, t.colBez, t.colAnzahl].join(';'),
    ...estimate.map(it => [it.artnr, `"${it.bez}"`, it.qty].join(';')),
  ];
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `bom_${name.replace(/[^a-z0-9]+/gi, '_')}.csv`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
