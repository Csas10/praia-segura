import { Link } from 'react-router-dom';

export default function Footer() {
  const openPreferences = () => {
    window.dispatchEvent(new CustomEvent('mps-cookie-consent-open'));
  };

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <strong>Minha Praia Segura</strong>
          <p>Informação clara para decisões seguras na costa.</p>
        </div>

        <nav className="footer__nav" aria-label="Links de rodapé">
          <Link to="/about">Sobre</Link>
          <Link to="/docs">Documentação</Link>
          <Link to="/contact">Contato</Link>
          <Link to="/privacy">Privacidade</Link>
          <Link to="/terms">Termos</Link>
          <button type="button" className="footer__preferences" onClick={openPreferences}>
            Preferências de cookies
          </button>
        </nav>
      </div>
    </footer>
  );
}
