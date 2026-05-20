/**
 * Segmented control — a row of mutually-exclusive buttons.
 *
 * Used for the binary klemmung (KSK/LSK) and ausrichtung (Süd/O-W)
 * pickers. Buttons can be individually disabled via `option.disabled`,
 * which is how we grey out options that the current Flat system
 * doesn't support.
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(v:string)=>void} props.onChange
 * @param {{value:string, label:string, disabled?:boolean}[]} props.options
 */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button
          key={o.value}
          className={`seg-btn${value === o.value ? ' active' : ''}`}
          disabled={o.disabled}
          onClick={() => !o.disabled && onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
