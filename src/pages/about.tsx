export default function AboutPage() {
  return (
    <div className="page-shell">
      <div className="container narrow">
        <p className="eyebrow">Sobre</p>
        <h1>Uma base institucional clara para o piloto</h1>
        <p>
          O projeto <strong>Minha Praia Segura</strong> nasceu como uma iniciativa de apoio à segurança
          costeira, com foco em informação útil, comunicação clara e uso responsável de dados e
          tecnologias de IA.
        </p>
        <p>
          Nesta etapa institucional, o objetivo é fortalecer a apresentação pública do projeto,
          reforçar a confiabilidade da comunicação e preparar a base para futuras integrações
          controladas, sem abrir superfícies públicas desnecessárias.
        </p>

        <div className="info-grid">
          <article className="feature-card">
            <h3>Missão</h3>
            <p>Servir como referencial de informação segura e acessível sobre praias, riscos e contexto local.</p>
          </article>
          <article className="feature-card">
            <h3>Foco</h3>
            <p>Priorizar clareza institucional, proteção de dados e critérios de confiança antes de expandir serviços.</p>
          </article>
          <article className="feature-card">
            <h3>Escopo atual</h3>
            <p>Site institucional, documentação pública, consentimento e fluxo de contato com comunicação precisa.</p>
          </article>
        </div>
      </div>
    </div>
  );
}
