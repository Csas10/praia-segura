const documents = [
  {
    title: 'Guia do piloto institucional',
    description: 'Visão geral do escopo público atual, limites do projeto e critérios de segurança.',
    href: '/docs/guia-do-piloto-institucional.txt',
  },
  {
    title: 'Checklist de conformidade',
    description: 'Itens essenciais de privacidade, consentimento, conteúdo e validações antes de novas integrações.',
    href: '/docs/checklist-conformidade.txt',
  },
];

export default function DocsPage() {
  return (
    <div className="page-shell">
      <div className="container narrow">
        <p className="eyebrow">Documentação</p>
        <h1>Arquivos públicos e materiais de referência</h1>
        <p>
          A documentação do piloto é mantida em formato estável e sem dados operacionais sensíveis.
          Os materiais públicos servem como referência para comunicação, apoio e validação das etapas
          iniciais do projeto.
        </p>

        <div className="doc-list">
          {documents.map((document) => (
            <a key={document.title} className="doc-item" href={document.href} download>
              <strong>{document.title}</strong>
              <span>{document.description}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
