import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mps_cookie_consent_v1';

function safeGetItem(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // storage unavailable (e.g., private mode); treat as unset
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    // storage unavailable; do not throw
    return false;
  }
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const value = safeGetItem(STORAGE_KEY);
    setOpen(value === null);

    const handleOpen = () => setOpen(true);
    window.addEventListener('mps-cookie-consent-open', handleOpen);

    return () => {
      window.removeEventListener('mps-cookie-consent-open', handleOpen);
    };
  }, []);

  const saveChoice = (accepted: boolean) => {
    safeSetItem(STORAGE_KEY, accepted ? 'accepted' : 'declined');
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Consentimento de cookies">
      <div className="container cookie-banner__inner">
        <div>
          <strong>Preferências de cookies</strong>
          <p>
            Este piloto não utiliza cookies não essenciais nem rastreadores. Sua escolha é
            guardada somente no armazenamento local do navegador. Nesta versão, aceitar ou
            rejeitar não ativa analytics, marketing ou perfilamento.
          </p>
        </div>

        <div className="cookie-banner__actions">
          <button type="button" className="button button--ghost" onClick={() => saveChoice(false)}>
            Rejeitar
          </button>
          <button type="button" className="button button--primary" onClick={() => saveChoice(true)}>
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
