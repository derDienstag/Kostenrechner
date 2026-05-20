import {
  Layers, MapPin, Zap, Wind, Snowflake, MountainSnow, Info, Mail,
  Settings, Database, RotateCcw, Download, Upload, Package, Lock,
  LogOut, ChevronUp, ChevronDown,
} from 'lucide-react';

/**
 * Icon registry — keep all icon imports in one place so the rest of the
 * codebase can refer to icons by string name. Component lookups are O(1).
 *
 * Adding an icon: import it from `lucide-react` and add it to `ICONS`.
 */
const ICONS = {
  layers: Layers,
  'map-pin': MapPin,
  zap: Zap,
  wind: Wind,
  snowflake: Snowflake,
  'mountain-snow': MountainSnow,
  info: Info,
  mail: Mail,
  settings: Settings,
  database: Database,
  'rotate-ccw': RotateCcw,
  download: Download,
  upload: Upload,
  package: Package,
  lock: Lock,
  'log-out': LogOut,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
};

/**
 * Render a Lucide icon by name.
 *
 * @param {object} props
 * @param {string} props.name   Key in `ICONS`.
 * @param {number} [props.size=18]
 * @param {object} [props.style]
 */
export function Icon({ name, size = 18, style = {} }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return (
    <span className="ico" style={{ width: size, height: size, ...style }}>
      <Cmp size={size} strokeWidth={1.8} style={{ color: 'currentColor' }} />
    </span>
  );
}
