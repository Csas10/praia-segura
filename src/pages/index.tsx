import { FormEvent, useState } from 'react';

const situationCards = [
  { label: 'Maré', value: 'Baixa', tone: 'calm' },
  { label: 'Ondas', value: 'Moderadas', tone: 'info' },
  { label: 'Vento', value: '12 km/h', tone: 'safe' },
  { label: 'Risco', value: 'Baixo', tone: 'safe' },
];

const quickActions = [
  'Verificar aviso para a faixa de banho',
  'Confirmar condições de vento e maré',
  'Enviar relato de risco em 30 segundos',
];

export default function HomePage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow">Segurança costeira em tempo real</p>
            <h1>Decisões mais seguras começaram a ser tomadas antes de entrar na água.</h1>
            <p className="lead">
              Acompanhe condições da praia, identifique riscos rápidos e compartilhe
              informações úteis para quem vive e visita a costa.
            </p>

            <div className="hero__actions">
              <a className="button button--primary" href="#alertas">
                Ver alertas
              </a>
              <a className="button button--ghost" href="#relatar">
                Relatar risco
              </a>
            </div>
          </div>

          <div className="hero__panel" aria-label="Resumo de condições">
            <div className="status-pill">Status: monitorado</div>
            <div className="status-grid">
              {situationCards.map((card) => (
                <div key={card.label} className={`stat ${card.tone}`}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="alertas" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Contexto do usuário</p>
            <h2>O que a aplicação ajuda a decidir</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>Condições da água</h3>
              <p>Maré, vento e correntes em linguagem simples para apoio rápido.</p>
            </article>
            <article className="feature-card">
              <h3>Risco percebido</h3>
              <p>Avaliação direta de nível de atenção e comportamento da costa.</p>
            </article>
            <article className="feature-card">
              <h3>Comunicação útil</h3>
              <p>Relatos de risco ajudam a manter a praia mais informada e acolhedora.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container split-layout">
          <div>
            <p className="eyebrow">Ações rápidas</p>
            <h2>Atendimento ao usuário em contexto real</h2>
            <ul className="checklist">
              {quickActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="callout" aria-live="polite">
            <strong>Recomendação</strong>
            <p>
              Antes de nadar, confira as condições locais e siga orientações de
              guarda ou monitoramento da praia.
            </p>
          </div>
        </div>
      </section>

      <section id="relatar" className="section">
        <div className="container form-shell">
          <div>
            <p className="eyebrow">Relatar incidente</p>
            <h2>Contribua com contexto útil para a comunidade</h2>
          </div>

          <form className="report-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Praia
                <input name="beach" defaultValue="Praia da Costa Norte" />
              </label>
              <label>
                Horário
                <input name="time" type="time" defaultValue="09:30" />
              </label>
            </div>

            <label>
              Tipo de risco
              <select name="risk" defaultValue="Ondas fortes">
                <option>Ondas fortes</option>
                <option>Corrente perigosa</option>
                <option>Falta de sinalização</option>
                <option>Outros</option>
              </select>
            </label>

            <label>
              Observação
              <textarea
                name="description"
                rows={4}
                defaultValue="Turistas demonstraram insegurança junto à faixa de banho neste horário."
              />
            </label>

            <button type="submit" className="button button--primary">
              Enviar relato
            </button>

            {submitted && (
              <p className="success-message" role="status">
                Relato registrado com sucesso. A comunidade receberá essa atualização.
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
