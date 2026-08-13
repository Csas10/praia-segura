export default function PrivacyPage() {
  return (
    <section className="page-shell">
      <div className="container narrow">
        <p className="eyebrow">Privacidade</p>
        <h1>Política de Privacidade</h1>

        <div className="callout">
          <p>
            <strong>Resumo em linguagem simples</strong>
          </p>
          <p>
            Usamos somente os dados necessários para operar a plataforma, responder
            solicitações, criar contas e localizar praias quando você autoriza. Não
            vendemos dados pessoais. A localização é usada na consulta ativa e não
            deve ser rastreada continuamente na versão web. Para exercer seus
            direitos, escreva para <a href="mailto:contato@minhapraiasegura.com.br">contato@minhapraiasegura.com.br</a>.
          </p>
        </div>

        <p>
          <strong>Nesta Política</strong>
        </p>
        <ol>
          <li>Quem somos e controlador</li>
          <li>Escopo</li>
          <li>Dados, finalidades e retenção</li>
          <li>Localização</li>
          <li>Bases legais</li>
          <li>Cookies</li>
          <li>Compartilhamento</li>
          <li>Transferências internacionais</li>
          <li>Retenção e eliminação</li>
          <li>Seus direitos</li>
          <li>Crianças e adolescentes</li>
          <li>IA e decisões automatizadas</li>
          <li>Segurança e incidentes</li>
          <li>Alterações</li>
          <li>Contato</li>
        </ol>

        <h2>1. Quem somos e quem controla os dados</h2>
        <p>
          A Minha Praia Segura é uma iniciativa digital de informação e apoio à
          segurança no litoral brasileiro. Para fins da Lei Geral de Proteção de
          Dados Pessoais (LGPD), o controlador dos dados pessoais tratados pela
          plataforma é <strong>Cleyton Santiago</strong>, responsável pelo projeto Minha Praia
          Segura.
        </p>
        <p>
          <strong>Canal de privacidade e atendimento aos titulares:</strong><br />
          <a href="mailto:contato@minhapraiasegura.com.br">contato@minhapraiasegura.com.br</a><br />
          <strong>Site:</strong> <a href="https://minhapraiasegura.com.br">https://minhapraiasegura.com.br</a>
        </p>
        <p>
          Caso a iniciativa seja posteriormente formalizada em outra pessoa
          jurídica ou altere o responsável pelo tratamento, esta identificação
          será atualizada e a mudança relevante será comunicada.
        </p>

        <h2>2. Escopo desta Política</h2>
        <p>
          Esta Política se aplica ao site, aos formulários, às contas de usuário e
          aos recursos digitais da Minha Praia Segura que a ela façam referência.
          Ela não controla sites, aplicativos ou serviços de terceiros acessados
          por links externos, que possuem regras próprias.
        </p>
        <p>
          A plataforma está em evolução. Recursos anunciados no roadmap — como
          dados ambientais em tempo real, motor de risco por inteligência
          artificial, aplicativo móvel e painéis institucionais — somente poderão
          tratar novos dados depois de avaliação de privacidade, definição de base
          legal e atualização das informações ao usuário.
        </p>

        <h2>3. Quais dados tratamos, para quê e por quanto tempo</h2>
        <p>
          A tabela descreve o tratamento compatível com os fluxos atuais.
          Funcionalidades futuras deverão passar por nova avaliação antes da
          ativação.
        </p>

        <table>
          <thead>
            <tr>
              <th>Contexto</th>
              <th>Dados</th>
              <th>Finalidade e base legal</th>
              <th>Retenção</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Navegação e segurança</td>
              <td>IP, data e hora, navegador, dispositivo, páginas, falhas e eventos de segurança.</td>
              <td>Operar, proteger e diagnosticar o serviço; prevenir fraude e abuso. Legítimo interesse, execução do serviço e obrigação legal, conforme o caso.</td>
              <td>Em regra, até 6 meses para registros de acesso quando o Marco Civil for aplicável; prazo maior somente por obrigação ou ordem válida.</td>
            </tr>
            <tr>
              <td>Busca de praias</td>
              <td>Termos pesquisados, cidade/estado e resultados consultados.</td>
              <td>Responder à busca e melhorar a experiência. Execução da solicitação e legítimo interesse, com minimização.</td>
              <td>Durante a sessão; histórico só será associado à conta se essa função for oferecida e informada.</td>
            </tr>
            <tr>
              <td>Localização</td>
              <td>Coordenadas fornecidas pelo dispositivo, quando autorizadas.</td>
              <td>Encontrar praias próximas. Consentimento/permissão do dispositivo e execução da solicitação.</td>
              <td>Durante a consulta ativa; sem rastreamento contínuo em segundo plano na versão web.</td>
            </tr>
            <tr>
              <td>Cadastro e conta</td>
              <td>Nome completo, e-mail, perfil declarado e registros de autenticação, quando disponíveis.</td>
              <td>Criar e administrar a conta, personalizar recursos e proteger o acesso. Execução do serviço e legítimo interesse.</td>
              <td>Enquanto a conta estiver ativa; depois, somente pelo período necessário a segurança, obrigações legais e direitos. Backups: até 90 dias.</td>
            </tr>
            <tr>
              <td>Contato e suporte</td>
              <td>Nome, e-mail, assunto, mensagem e histórico.</td>
              <td>Responder dúvidas, sugestões e relatos. Procedimentos solicitados e legítimo interesse.</td>
              <td>Até 24 meses após o encerramento, salvo necessidade legal ou pedido válido de eliminação.</td>
            </tr>
            <tr>
              <td>Cookies e armazenamento local</td>
              <td>Sessão, preferências e sinais técnicos necessários.</td>
              <td>Segurança, sessão e preferências. Execução do serviço e legítimo interesse. Não necessários exigem escolha prévia.</td>
              <td>Sessão: até o encerramento; preferências: em regra, até 12 meses ou exclusão.</td>
            </tr>
            <tr>
              <td>Comunicações opcionais</td>
              <td>E-mail e preferências de recebimento.</td>
              <td>Enviar novidades ou alertas opcionais. Consentimento revogável.</td>
              <td>Até cancelamento; oposição mínima pode ser mantida para impedir novos envios.</td>
            </tr>
          </tbody>
        </table>

        <h2>4. Como usamos a localização</h2>
        <ul>
          <li>A localização só é solicitada quando você aciona “usar minha localização” e o dispositivo apresenta a permissão.</li>
          <li>Você pode negar e pesquisar manualmente por praia, cidade ou estado.</li>
          <li>Na versão web, a localização deve ser processada apenas durante a consulta ativa; não há rastreamento contínuo em segundo plano.</li>
          <li>A permissão pode ser revogada nas configurações do navegador ou dispositivo.</li>
          <li>Histórico, favoritos ou alertas de proximidade futuros exigirão aviso específico antes da ativação.</li>
        </ul>

        <h2>5. Bases legais utilizadas</h2>
        <ul>
          <li><strong>Execução do serviço:</strong> busca, cadastro, conta e atendimento.</li>
          <li><strong>Consentimento:</strong> geolocalização precisa, comunicações opcionais e cookies não necessários.</li>
          <li><strong>Legítimo interesse:</strong> segurança, prevenção a abuso, melhoria técnica e organização do atendimento, com análise de necessidade.</li>
          <li><strong>Obrigação legal e exercício regular de direitos:</strong> guarda e apresentação de registros quando exigidas.</li>
          <li><strong>Proteção da vida ou incolumidade física:</strong> somente em situação concreta; não autoriza monitoramento amplo.</li>
        </ul>

        <h2>6. Cookies e tecnologias semelhantes</h2>
        <p>
          Cookies necessários podem funcionar para segurança, sessão e preferências. Cookies de medição, personalização não essencial ou publicidade só podem ser ativados após escolha prévia e informada, com recusa tão simples quanto a aceitação.
        </p>
        <ul>
          <li><strong>Necessários:</strong> funções básicas, proteção e sessão.</li>
          <li><strong>Preferências:</strong> lembram opções e são opcionais quando dispensáveis.</li>
          <li><strong>Medição:</strong> se implementada, permanece desativada até consentimento.</li>
          <li><strong>Publicidade:</strong> não é finalidade prevista nesta versão; eventual adoção exigirá atualização e escolha adequada.</li>
        </ul>

        <h2>7. Com quem podemos compartilhar dados</h2>
        <p>
          Não vendemos nem alugamos dados pessoais. O compartilhamento pode ocorrer, no limite necessário, com provedores de hospedagem, segurança, banco de dados, autenticação, e-mail e suporte; provedores de mapas e geolocalização quando esses recursos forem usados; autoridades mediante obrigação ou ordem válida; assessores sob confidencialidade; ou novo responsável em reorganização comunicada.
        </p>

        <h2>8. Transferências internacionais</h2>
        <p>
          Fornecedores podem operar servidores fora do Brasil. A transferência deverá observar a LGPD e regras da ANPD, com avaliação do fornecedor, limitação de finalidade e mecanismos adequados.
        </p>

        <h2>9. Retenção, anonimização e eliminação</h2>
        <p>
          Mantemos dados somente pelo tempo necessário. Ao fim, eles são eliminados ou anonimizados, salvo conservação permitida ou exigida por lei, ordem válida ou exercício regular de direitos. Pedidos de eliminação consideram obrigações legais, prevenção a fraude, oposição e ciclo de backups.
        </p>

        <h2>10. Seus direitos</h2>
        <ul>
          <li>Confirmação e acesso;</li>
          <li>correção;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou irregulares;</li>
          <li>portabilidade, quando aplicável;</li>
          <li>informação sobre compartilhamento;</li>
          <li>informação sobre a possibilidade de negar consentimento;</li>
          <li>revogação do consentimento e eliminação, ressalvadas hipóteses legais;</li>
          <li>oposição a tratamento irregular sem consentimento;</li>
          <li>revisão e explicação de decisões unicamente automatizadas;</li>
          <li>petição à ANPD ou a órgãos de defesa do consumidor.</li>
        </ul>
        <p>
          Envie a solicitação para <a href="mailto:contato@minhapraiasegura.com.br?subject=Direitos%20LGPD">contato@minhapraiasegura.com.br</a> com o assunto “Direitos LGPD”. Poderemos confirmar sua identidade para proteger os dados.
        </p>

        <h2>11. Crianças e adolescentes</h2>
        <p>
          O conteúdo público pode ser consultado por famílias, mas o cadastro é destinado a maiores de 18 anos. Menores devem usar a plataforma com supervisão de responsável. Uma futura conta dirigida a menores deverá observar melhor interesse, linguagem acessível, minimização e, para crianças, consentimento específico e destacado de pelo menos um responsável, salvo hipótese legal.
        </p>

        <h2>12. Inteligência artificial e decisões automatizadas</h2>
        <p>
          Índices, previsões ou alertas por IA são probabilísticos e podem estar em desenvolvimento, teste ou cobertura limitada. Não devem produzir decisão pessoal relevante sem informação clara. Quando uma decisão unicamente automatizada afetar interesses do titular, haverá canal para revisão e explicação. Alertas não constituem garantia de segurança nem substituem salva-vidas e autoridades.
        </p>

        <h2>13. Segurança da informação e incidentes</h2>
        <p>
          Adotamos medidas proporcionais ao risco, como controle de acesso, criptografia em trânsito, atualizações, backups, registro de eventos, gestão de fornecedores e limitação de privilégios. Em incidente com risco ou dano relevante, serão adotadas medidas de contenção e as comunicações exigidas à ANPD e aos titulares.
        </p>

        <h2>14. Alterações desta Política</h2>
        <p>
          Versão, vigência e histórico serão mantidos no site. Mudanças materiais que dependam de consentimento serão apresentadas antes do novo tratamento; o silêncio não valerá como consentimento.
        </p>

        <h2>15. Fale conosco</h2>
        <p>
          <strong>Controlador:</strong> Cleyton Santiago, responsável pelo projeto Minha Praia Segura<br />
          <strong>E-mail:</strong> <a href="mailto:contato@minhapraiasegura.com.br">contato@minhapraiasegura.com.br</a><br />
          <strong>Atendimento:</strong> Brasil
        </p>

        <h3>Referências</h3>
        <ul>
          <li><a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm">LGPD — texto compilado</a></li>
          <li><a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm">Marco Civil da Internet</a></li>
          <li><a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares">ANPD — Direitos dos titulares</a></li>
          <li><a href="https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf/@@display-file/file">ANPD — Guia de cookies</a></li>
        </ul>

        <p>
          Controle de versão: 1.0, primeira versão pública, publicada em 6 de agosto de 2026.
        </p>
      </div>
    </section>
  );
}
