export default function ContactPage() {
  return (
    <div className="page-shell">
      <div className="container narrow">
        <p className="eyebrow">Contato</p>
        <h1>Canal oficial de atendimento</h1>
        <p>
          Para contato institucional, solicitações de privacidade, suporte ou exercício de direitos
          previstos na LGPD, utilize o e-mail oficial do projeto.
        </p>

        <div className="contact-card">
          <strong>E-mail oficial</strong>
          <a href="mailto:contato@minhapraiasegura.com.br">contato@minhapraiasegura.com.br</a>
          <p>
            Neste piloto, o atendimento ocorre exclusivamente pelo e-mail oficial. Não há
            formulário público nem armazenamento intermediário de mensagens.
          </p>
        </div>
      </div>
    </div>
  );
}
