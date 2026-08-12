import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <strong>Minha Praia Segura</strong>
          <p>Informação clara para decisões seguras na costa.</p>
        </div>

        <nav className="footer__nav" aria-label="Links de rodapé">
          <Link to="/privacy">Privacidade</Link>
          <Link to="/terms">Termos</Link>
        </nav>
      </div>
    </footer>
  );
}
