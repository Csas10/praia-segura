import { useState } from 'react';
import ForecastPanel from '@/components/ForecastPanel';
import LocationSearch, { type LocationSearchResult } from '@/components/LocationSearch';

const demoIndicators = [
  { label: 'Estado de dados', value: 'Demonstração', tone: 'info' },
  { label: 'Validade', value: 'Fictícia', tone: 'calm' },
  { label: 'Origem', value: 'Exemplo', tone: 'safe' },
  { label: 'Uso', value: 'Não oficial', tone: 'safe' },
];

const quickActions = [
  'Consultar autoridades locais antes de entrar na água',
  'Confirmar sinalização, guarda e condições da praia',
  'Coletar e reportar dados com rigor e consentimento',
];

export default function HomePage() {
  const [location, setLocation] = useState<LocationSearchResult | null>(null);
  const ibgeId = location?.id.match(/\d{7}$/)?.[0] ?? null;

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow">Demonstração de produto</p>
            <h1>Plataforma de apoio à segurança costeira em desenvolvimento.</h1>
            <p className="lead">
              Esta interface representa uma <strong>demonstração</strong> de produto e não usa valores
              ao vivo de maré, vento, risco ou alertas reais. Para decisões de segurança,
              consulte a autoridade local e sinalização oficial da praia.
            </p>

            <div className="hero__actions">
              <a className="button button--primary" href="#alertas">
                Entender a proposta
              </a>
              <a className="button button--ghost" href="/privacy">
                Ver política
              </a>
            </div>
          </div>

          <div className="hero__panel" aria-label="Resumo demonstrativo">
            <div className="status-pill">Status: demonstração</div>
            <div className="status-grid">
              {demoIndicators.map((card) => (
                <div key={card.label} className={`stat ${card.tone}`}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="busca-localidade" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Consulta segura</p>
            <h2>Buscar cidade ou estado</h2>
            <p className="lead">
              Consulta oficial de estados e municípios brasileiros via IBGE, executada pelo
              servidor. Esta etapa ainda não inclui busca por nome de praia, condições do mar ou
              geolocalização.
            </p>
          </div>

          <LocationSearch onSelectMunicipality={setLocation} />
          <ForecastPanel location={location && location.stateCode && ibgeId ? {
            ibgeId,
            name: location.name,
            state: location.stateCode,
          } : null} />
        </div>
      </section>

      <section id="alertas" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">O que está em desenvolvimento</p>
            <h2>Base para validação de produto e integração com IA</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>Busca e localização</h3>
              <p>Mapa e busca por praias com foco em dados públicos e consentimento de uso.</p>
            </article>
            <article className="feature-card">
              <h3>Conteúdo institucional</h3>
              <p>Políticas, termos e áreas de documentação alinhadas à LGPD e ao uso de IA.</p>
            </article>
            <article className="feature-card">
              <h3>Integração segura</h3>
              <p>Agentes só ativos com flag de ambiente, autenticação e controle de orçamento.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container split-layout">
          <div>
            <p className="eyebrow">Boas práticas</p>
            <h2>Uso responsável em cenários de risco</h2>
            <ul className="checklist">
              {quickActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="callout" aria-live="polite">
            <strong>Importante</strong>
            <p>
              Nenhuma atualização nesta página substitui alertas oficiais, sinalização local,
              ou orientação de guarda e autoridades competentes.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
