import { useState } from 'react';
import { Icon } from './Icon.jsx';
import { sha256Hex, ADMIN_PASSWORD_HASH, ADMIN_SESSION_MS, LS_KEYS } from '../lib/constants.js';

/**
 * Modal for admin sign-in.
 *
 * Compares the SHA-256 of the entered password against the bundled
 * `ADMIN_PASSWORD_HASH` constant. On success, persists a session token
 * (just an expiry timestamp) in localStorage so reloads stay signed-in
 * for up to 4 hours.
 *
 * @param {object} props
 * @param {(value:boolean)=>void} props.onSetAdmin
 * @param {()=>void} props.onSignedIn  Called after successful login.
 * @param {()=>void} props.onClose
 * @param {object} props.t
 */
export function LoginModal({ onSetAdmin, onSignedIn, onClose, t }) {
  const [pw, setPw]       = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const hash = await sha256Hex(pw);
    if (hash === ADMIN_PASSWORD_HASH) {
      const exp = Date.now() + ADMIN_SESSION_MS;
      localStorage.setItem(LS_KEYS.auth, JSON.stringify({ exp }));
      onSetAdmin(true);
      onSignedIn();
    } else {
      setError(t.falschesPasswort);
      setPw('');
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.8)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 'var(--rad)', padding: 32, width: '100%', maxWidth: 340,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          paddingBottom: 16, borderBottom: '1px solid var(--border)',
        }}>
          <Icon name="lock" size={14} style={{ color: 'var(--text3)' }}/>
          <span style={{
            fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--text2)',
          }}>
            {t.adminLogin}
          </span>
        </div>

        <div className="lbl" style={{ marginBottom: 7 }}>{t.passwort}</div>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={e => setPw(e.target.value)}
          className="inp"
          style={{ marginBottom: error ? 6 : 0 }}
        />
        {error && (
          <p style={{ color: 'var(--err)', fontSize: 12, marginTop: 6 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            {t.abbrechen}
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
            {t.loginBtn}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 12 }}>
          {t.sessionHinweis}
        </p>
      </form>
    </div>
  );
}
