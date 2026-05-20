import { Icon } from './Icon.jsx';
import { Segmented } from './Segmented.jsx';
import { GROUND_SYSTEMS } from '../lib/constants.js';

/**
 * "Section 1" of the left column — pick a category (Flat / Pitch / Metal
 * / GROUND) and then drill down to the specific system, klemmung, and
 * orientation. The shape of the detail panel changes per category.
 *
 * State is fully controlled by the parent. We just render UI for the
 * given props and report changes back via setters.
 */
export function SystemPicker(props) {
  const {
    t, idx,
    category, setCategory,
    flatSystem, setFlatSystem,
    flatKlemmung, setFlatKlemmung,
    flatAusrichtung, setFlatAusrichtung,
    pitchSystem, setPitchSystem,
    metalSystem, setMetalSystem,
    groundSystem, setGroundSystem,
    alpine, setAlpine,
    hasAlpineVariant,
    flatSystemKeysVisible,
  } = props;

  /** Tab definitions — ordered by frequency of use. */
  const CATS = [
    { id: 'Flat',   label: t.flat,   sub: t.flatSub },
    { id: 'Pitch',  label: t.pitch,  sub: t.pitchSub },
    { id: 'Metal',  label: t.metal,  sub: t.metalSub },
    { id: 'GROUND', label: t.ground, sub: t.groundSub },
  ];

  const currentFlatSys = idx.flat[flatSystem];

  return (
    <div style={{ padding: '24px 24px 20px' }}>
      <div className="sec-hdr" style={{ marginBottom: 16 }}>
        <Icon name="layers" size={13} style={{ color: 'var(--text3)' }}/>
        {t.montagesystem}
      </div>

      {/* Category tabs */}
      <div className="cat-tabs">
        {CATS.map(cat => (
          <button
            key={cat.id}
            className={`cat-tab${category === cat.id ? ' cat-tab-active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            <span className="cat-tab-name">{cat.label}</span>
            <span className="cat-tab-sub">{cat.sub}</span>
          </button>
        ))}
      </div>

      {/* Flat detail */}
      {category === 'Flat' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="lbl" style={{ marginBottom: 10 }}>{t.system}</div>
            <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {flatSystemKeysVisible.map(s => (
                <button
                  key={s}
                  className={`chip${flatSystem === s ? ' active' : ''}`}
                  onClick={() => setFlatSystem(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Alpine toggle (only if a reinforced variant exists for this system) */}
          {hasAlpineVariant(flatSystem) && (
            <div className={`toggle-wrap${alpine ? ' on' : ''}`} onClick={() => setAlpine(a => !a)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="mountain-snow" size={14} style={{ color: alpine ? 'var(--cyan)' : 'var(--text3)' }}/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: alpine ? 'var(--text)' : 'var(--text2)' }}>
                    {t.alpineLabel}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.alpineSub}</div>
                </div>
              </div>
              <div className="toggle-track" style={{ background: alpine ? 'var(--cyan)' : 'var(--border2)' }}>
                <div className="toggle-thumb" style={{ left: alpine ? '18px' : '2px', background: alpine ? 'oklch(12% 0.008 200)' : 'var(--text3)' }}/>
              </div>
            </div>
          )}

          {currentFlatSys && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <PickerCell
                label={t.klemmung}
                options={['KSK', 'LSK']}
                labelFor={k => k === 'KSK' ? t.ksk : t.lsk}
                value={flatKlemmung}
                setValue={setFlatKlemmung}
                allowed={currentFlatSys.klemmungen}
              />
              <PickerCell
                label={t.ausrichtung}
                options={['Ost/West', 'Süd']}
                labelFor={a => a === 'Ost/West' ? t.ow : t.sued}
                value={flatAusrichtung}
                setValue={setFlatAusrichtung}
                allowed={currentFlatSys.ausrichtungen}
              />
            </div>
          )}
        </div>
      )}

      {/* Pitch detail */}
      {category === 'Pitch' && (
        <div className="fade-up">
          <div className="lbl" style={{ marginBottom: 10 }}>{t.system}</div>
          <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {idx.pitch.map(p => (
              <button
                key={p.system}
                className={`chip${pitchSystem === p.system ? ' active' : ''}`}
                onClick={() => setPitchSystem(p.system)}
              >
                {t.systemLabels?.[p.system] || p.system}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metal detail */}
      {category === 'Metal' && (
        <div className="fade-up">
          <div className="lbl" style={{ marginBottom: 10 }}>{t.system}</div>
          <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {idx.metal.map(m => (
              <button
                key={m.system}
                className={`chip${metalSystem === m.system ? ' active' : ''}`}
                onClick={() => setMetalSystem(m.system)}
              >
                {m.system}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ground detail */}
      {category === 'GROUND' && (
        <div className="fade-up">
          <div className="lbl" style={{ marginBottom: 10 }}>{t.system}</div>
          <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {GROUND_SYSTEMS.map(g => (
              <button
                key={g.system}
                className={`chip${groundSystem === g.system ? ' active' : ''}`}
                onClick={() => setGroundSystem(g.system)}
              >
                {g.system}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * If a Flat system supports more than one klemmung/ausrichtung, render
 * a Segmented control. Otherwise, render the single allowed value as
 * static text — there's nothing to pick.
 */
function PickerCell({ label, options, labelFor, value, setValue, allowed }) {
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 8 }}>{label}</div>
      {allowed.length > 1 ? (
        <Segmented
          value={value}
          onChange={setValue}
          options={options.map(o => ({
            value: o,
            label: labelFor(o),
            disabled: !allowed.includes(o),
          }))}
        />
      ) : (
        <div style={{
          padding: '8px 11px', border: '1px solid var(--border)',
          borderRadius: 'var(--rad-sm)', fontSize: 12, color: 'var(--text2)',
        }}>
          {labelFor(allowed[0])}
        </div>
      )}
    </div>
  );
}
