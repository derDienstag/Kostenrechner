import { Icon } from './Icon.jsx';

/**
 * Labelled range slider with current-value readout.
 *
 * Used for wind & snow load inputs. Renders a cyan progress fill on the
 * left side of the thumb (CSS background gradient), an icon-prefixed
 * label, and the current value as a monospace badge.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {number} props.value
 * @param {number} props.min
 * @param {number} props.max
 * @param {number} props.step
 * @param {(v:number)=>void} props.onChange
 * @param {string} props.unit
 * @param {string} props.iconName
 */
export function SliderField({ label, value, min, max, step, onChange, unit, iconName }) {
  const pct = ((value - min) / (max - min) * 100).toFixed(1);
  // Two-stop gradient = filled "track" left of thumb, dim track to the right.
  const bg = `linear-gradient(to right, var(--cyan) 0%, var(--cyan) ${pct}%, var(--border2) ${pct}%, var(--border2) 100%)`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name={iconName} size={13} style={{ color: 'var(--text3)' }}/>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)' }}>{label}</span>
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--cyan)',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--rad-sm)', padding: '3px 9px', fontVariantNumeric: 'tabular-nums',
        }}>
          {value.toFixed(1)} {unit}
        </div>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="slider"
        style={{ background: bg }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{min}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{max}</span>
      </div>
    </div>
  );
}
