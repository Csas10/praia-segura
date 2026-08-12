import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="page-shell">
      <div className="container narrow centered">
        <p className="eyebrow">404</p>
        <h1>Página não encontrada</h1>
        <p>O conteúdo solicitado não está disponível nesta rota.</p>
        <Link className="button button--primary" to="/">
          Voltar para o início
        </Link>
      </div>
    </section>
  );
}
