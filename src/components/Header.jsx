import { Icon } from './Icon.jsx';
import { LANGUAGES } from '../lib/constants.js';

/**
 * Sticky top header.
 *
 * Holds the AEROCOMPACT logo, page title, the DE/EN/IT language
 * switcher, and (when the admin is signed in) buttons for the backend
 * panel and logout.
 *
 * @param {object} props
 * @param {string} props.lang
 * @param {(l:string)=>void} props.onSetLang
 * @param {boolean} props.isAdmin
 * @param {boolean} props.showBackend
 * @param {()=>void} props.onToggleBackend
 * @param {()=>void} props.onLogout
 * @param {object} props.t
 */
export function Header({ lang, onSetLang, isAdmin, showBackend, onToggleBackend, onLogout, t }) {
  return (
    <header className="hdr">
      <div className="hdr-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src="logo.png"
            alt="AEROCOMPACT"
            style={{ height: 20, filter: 'invert(1) brightness(1.1)' }}
          />
          <div className="hdr-divider" style={{ width: 1, height: 18, background: 'var(--border)' }}/>
          <span
            className="hdr-title"
            style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.18em', color: 'var(--text3)',
            }}
          >
            {t.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {LANGUAGES.map(code => (
            <button
              key={code}
              className={`lang-btn${lang === code ? ' active' : ''}`}
              onClick={() => onSetLang(code)}
            >
              {code}
            </button>
          ))}

          {isAdmin && (
            <>
              <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }}/>
              <button
                className="btn btn-ghost"
                onClick={onToggleBackend}
                style={{
                  padding: '5px 10px', fontSize: 10, gap: 4,
                  background:   showBackend ? 'var(--surface2)' : undefined,
                  borderColor:  showBackend ? 'var(--border2)'  : undefined,
                }}
              >
                <Icon name="settings" size={12}/>{t.backend}
              </button>
              <button
                className="btn btn-ghost"
                onClick={onLogout}
                style={{ padding: '5px 8px' }}
                title="Logout"
              >
                <Icon name="log-out" size={12}/>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
