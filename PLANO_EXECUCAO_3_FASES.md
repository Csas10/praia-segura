# Plano de execução em 3 fases

## Restrições gerais

- Não ativar `ENABLE_AGENTS`.
- Não implementar índice de risco por IA.
- Não adicionar dados marítimos fictícios.
- Não criar formulário sem backend.
- Não inserir chaves no frontend.
- Não fazer commit, merge ou deploy.

## Fase 1 — Base institucional

### 1.1 Sobre
- Objetivo: apresentar a missão, visão, origem e contexto institucional do projeto de forma clara e confiável.
- Dependências: identidade visual, navegação institucional, conteúdo aprovado e revisão editorial.
- Arquivos previstos: `src/pages/about.tsx`, `src/routes.tsx`, `src/layouts/parts/Header.tsx`, `src/layouts/parts/Footer.tsx`, `src/pages/index.tsx`.
- Riscos: inconsistência de mensagem institucional, ausência de fonte e perda de confiabilidade reputacional.
- Proteção de segurança e privacidade: nenhum dado pessoal coletado; conteúdo estático e sem interações sensíveis.
- Testes necessários: renderização da página, navegação, links internos, revisão de texto e validação de acessibilidade básica.
- Critério de aceite: página acessível, responsiva, sem elementos promocionais ou informativos indevidos e sem afirmações de dados em tempo real.
- Condição de rollback: se o conteúdo não estiver alinhado ao posicionamento aprovado, reverter para a versão anterior e mantê-la apenas no nível institucional.

### 1.2 Contato
- Objetivo: disponibilizar canal de contato oficial, sem criar fluxo sem backend ou mecanismo de coleta incompatível.
- Dependências: e-mail institucional, formulário futuro com backend, revisão de dados e política de privacidade.
- Arquivos previstos: `src/pages/contact.tsx`, `src/routes.tsx`, `src/layouts/parts/Footer.tsx`, `src/pages/privacy.tsx`.
- Riscos: exposição indevida de e-mail, uso inadequado de canal público, coleta sem tratativa posterior.
- Proteção de segurança e privacidade: canal apenas de contato, sem armazenamento de mensagens sem backend e sem envio de dados sensíveis ao frontend.
- Testes necessários: renderização, validação boa de links, responsividade, acessibilidade e mensagem de fallback.
- Critério de aceite: página funcional e consistente com o fluxo de suporte real, sem forma de coleta de dados sem backend.
- Condição de rollback: desativar eventual formulário e manter somente o e-mail oficial `contato@minhapraiasegura.com.br`, sem armazenamento intermediário.

### 1.3 Documentação e downloads
- Objetivo: disponibilizar documentação institucional, orientações e arquivos públicos com informação estável e revisada.
- Dependências: estrutura de arquivos estáticos, política pública e organização documental, revisão de direitos autorais e permissões.
- Arquivos previstos: `public/docs/`, `src/pages/docs.tsx`, `src/routes.tsx`, `src/layouts/parts/Footer.tsx`.
- Riscos: arquivo inexistente, link quebrado, conteúdo desatualizado, política de downloads incompatível com licença e governança.
- Proteção de segurança e privacidade: documentos públicos, sem dados pessoais, sem link a recursos dinâmicos e sem execução de scripts externos.
- Testes necessários: validação de links, download, MIME types corretos, presença de arquivos e acessibilidade dos documentos.
- Critério de aceite: todos os arquivos disponíveis e navegáveis, sem erros de referência e com páginas públicas e legíveis.
- Condição de rollback: se houver inconsistência documental ou risco de contenção inadequada, remover os links e manter somente os documentos essencialmente aprovados.

### 1.4 Consentimento e banner de cookies
- Objetivo: dar transparência sobre cookies e preferências, sem coletar dados sem base legal clara.
- Dependências: política de privacidade v1.0, decisão de consentimento, configuração de cookies essenciais e mecanismo de opt-in/opt-out.
- Arquivos previstos: `src/components/CookieConsent.tsx`, `src/pages/privacy.tsx`, `src/pages/terms.tsx`, `src/layouts/RootLayout.tsx`, `src/App.tsx`.
- Riscos: consentimento genérico, ausência de preferência, coleta de dados sem limite, violação de LGPD ou rastreamento não informado.
- Proteção de segurança e privacidade: apenas cookies essenciais e consentimento explícito para recursos não essenciais; sem tracking oculto.
- Testes necessários: aprovação de consentimento, persistência de preferência, comportamento com cookies bloqueados e cobertura de não-aceitação.
- Critério de aceite: consentimento documentado, preferências persistentes e não há execução de rastreadores sem opt-in.
- Condição de rollback: se houver qualquer coleta não consentida, remover o banner e manter somente cookies estritamente indispensáveis.

### 1.5 SEO, acessibilidade e responsividade
- Objetivo: melhorar indexação, usabilidade e experiência em navegadores e dispositivos sem introduzir conteúdo falso ou invasivo.
- Dependências: `public/robots.txt`, `public/sitemap.xml`, tags de cabeçalho, meta tags, CSS responsivo e checagens de acessibilidade.
- Arquivos previstos: `index.html`, `public/robots.txt`, `public/sitemap.xml`, `src/styles/**`, `src/layouts/**`, páginas públicas.
- Riscos: SEO mal configurado, páginas quebradas em mobile, contraste inadequado, navegação pouco acessível.
- Proteção de segurança e privacidade: conteúdo estático, sem scripts externos de forma não aprovada, sem coleta dinâmica de dados sensíveis.
- Testes necessários: Lighthouse ou validação equivalente, testes de responsividade, contraste, teclado e roteamento.
- Critério de aceite: páginas renderizam corretamente em desktop e mobile, sem regressões e com metadata apropriada.
- Condição de rollback: se a alteração gerar regressão visual ou funcional, reverter aos ativos estáveis e manter apenas ajustes seguros e mínimos.

### 1.6 Testes institucionais e regressão
- Objetivo: cobrir as páginas públicas e fluxos básicos do piloto institucional sem acoplar comportamento de produção ainda não implementado.
- Dependências: configuração de testes com Vitest, RTL e cobertura de rotas principais.
- Arquivos previstos: `src/test/**`, `src/pages/**`, `src/routes.tsx`, `src/App.tsx`.
- Riscos: testes frágeis, falsos positivos e cobertura insuficiente para páginas públicas.
- Proteção de segurança e privacidade: testes sem dados reais, sem tokens, sem quebras de ambiente e sem uso de credenciais.
- Testes necessários: renderização de página inicial, privacidade, termos, 404 e navegação básica.
- Critério de aceite: 100% das rotas públicas essenciais validadas e ausência de regressão em navegação.
- Condição de rollback: se a suíte ficar frágil ou incorreta, reduzir escopo e priorizar rotas críticas apenas.

## Fase 2 — Consulta segura

### 2.1 Busca de praias
- Objetivo: permitir busca de praias no site de forma controlada, com fontes explicitadas, sem expor dados geográficos ou risco sem contexto.
- Dependências: contrato de dados, API no servidor, decisão de dados reais/estimados, design de busca e revisão legal.
- Arquivos previstos: `src/pages/search.tsx`, `src/server/api/**`, `src/lib/**`, `src/components/**`, `src/routes.tsx`.
- Riscos: busca sem fonte, erro de dados, consumo indiscriminado, erro de geolocalização e disparo de requisições do frontend sem controle.
- Proteção de segurança e privacidade: todas as chamadas para APIs externas devem ocorrer no servidor; sem envio de chaves para o cliente; sem armazenamento de localização sem consentimento.
- Testes necessários: busca por cidade, estado, resultado vazio, timeout, erro de rede, checagem de fonte e status de dados.
- Critério de aceite: consistência de resultados, resposta útil e mensagem clara quando dados inexistirem ou falharem.
- Condição de rollback: se a busca não tiver fonte confiável ou puder falhar em produção sem controle, desabilitar a funcionalidade e manter a página em estado de demonstração informativa.

### 2.2 Geolocalização apenas após ação do usuário
- Objetivo: capturar geolocalização de forma explícita, de acordo com a vontade do usuário e com consentimento claro.
- Dependências: APIs do navegador, políticas de consentimento e UX segura para geolocalização.
- Arquivos previstos: `src/components/LocationPrompt.tsx`, `src/pages/search.tsx`, `src/pages/index.tsx`, `src/lib/location.ts`.
- Riscos: coleta silenciosa de localização, rastreamento contínuo em segundo plano e violação de privacidade.
- Proteção de segurança e privacidade: pedir permissão apenas em clique explícito; não armazenar em background; não persistir sem necessidade; nunca coletar sem consentimento.
- Testes necessários: fluxo de consentimento, recusa, erro de permissões, timeout e comportamento em desktop/mobile.
- Critério de aceite: geolocalização só ocorre após ação do usuário e sem rastreamento contínuo.
- Condição de rollback: se a geolocalização for necessária fora do contexto de uso explícito, remover a funcionalidade até nova revisão legal.

### 2.3 APIs no servidor
- Objetivo: centralizar integrações externas no backend para reduzir risco de vazamento, uso indevido e exposição de chaves.
- Dependências: estrutura de servidor Express, cliente HTTP seguro, rate limiting, logs e política de timeout.
- Arquivos previstos: `src/server/**`, `src/lib/http-client.ts`, `src/server/entry.ts`.
- Riscos: vazamento de chaves, falhas de rede, rate limiting insuficiente e consumo indevido por clientes externos.
- Proteção de segurança e privacidade: chave somente no ambiente do servidor; limites de timeout e retry; logs sem conteúdo sensível; controle de origem e limite por IP ou token.
- Testes necessários: requisição de sucesso, erro de rede, timeout, 429 e respostas inesperadas.
- Critério de aceite: aplicação exige servidor para acesso externo e evita vazamento de segredos no cliente.
- Condição de rollback: se a integração externa não puder ser segura, bloquear a rota e manter a vista pública sem a funcionalidade.

### 2.4 Fontes, data/hora, cobertura e limitações
- Objetivo: separar dados reais, estimados e demonstrativos de forma explícita para evitar interpretação indevida.
- Dependências: fontes oficiais, contratos de dados, regras de divulgação e UX com indicação de status.
- Arquivos previstos: `src/components/DataStatusBadge.tsx`, páginas com informação pública, documentação interna de dados e `src/pages/index.tsx`.
- Riscos: misturar dados originados de fontes distintas, dar falsa sensação de atualização e assumir monitoramento em tempo real sem base.
- Proteção de segurança e privacidade: nenhum dado de usuário deve ser misturado ao vínculo de origem externa sem necessidade; status claro e rastreável.
- Testes necessários: validação de status, marcação de fonte e separação visual entre dados demonstrativos e reais.
- Critério de aceite: cada dado exibe origem, atualização e cobertura; qualquer recurso não pronto é claramente marcado.
- Condição de rollback: se o sistema não distinguir corretamente os dados, bloquear o trecho até a correção dos metadados e da apresentação.

### 2.5 Cache, timeout e indisponibilidade
- Objetivo: melhorar estabilidade e evitar falhas por latência ou indisponibilidade.
- Dependências: cache de leitura, timeouts mínimos, fallback seguro e monitoramento básico de integridade.
- Arquivos previstos: `src/lib/cache.ts`, `src/server/**`, `src/components/**`.
- Riscos: falhas de latência, requisições em cascata, instabilidade em produção e memória excessiva.
- Proteção de segurança e privacidade: cache somente em dados não sensíveis; sem retenção indevida de conteúdo de usuário.
- Testes necessários: timeout, indisponibilidade, recuperação, revalidação e limpeza de cache.
- Critério de aceite: a página continua funcional com mensagem clara quando os dados não estão disponíveis.
- Condição de rollback: se a estratégia de cache ou timeout criar inconsistência de dados, desabilitar cache e retornar para um estado estável.

### 2.6 Separação de dados reais, estimados e demonstrativos
- Objetivo: impedir que dados de demonstração sejam confundidos com dados operacionais reais.
- Dependências: taxa de status, marcos de dados, UI de sinalização e documentação de produto.
- Arquivos previstos: `src/pages/index.tsx`, `src/components/StatusPill.tsx`, `src/lib/data-status.ts`, `src/pages/search.tsx`.
- Riscos: conteúdo enganoso, apresentação com aparência oficial e má interpretação por usuários.
- Proteção de segurança e privacidade: todos os elementos de status devem ser explícitos, não escondidos em microtexto; nenhum dado fictício deve parecer real.
- Testes necessários: validação visual e textual em cada tela de dados, checagem de DOM e acessibilidade.
- Critério de aceite: qualquer dado demonstrativo ou estimado contém marcação clara e acessível.
- Condição de rollback: se a marcação não for globalmente consistente, desabilitar a exibição de dados e manter somente texto institucional.

### 2.1.1 Fase 2.1 — Fundação técnica e busca oficial por cidade/estado (implementada)

Esta subseção documenta a implementação concreta da Fase 2.1, autorizada exclusivamente com a
API oficial de Localidades do IBGE (https://servicodados.ibge.gov.br/api/docs/localidades).
Nenhuma busca por nome de praia, condição do mar ou geolocalização foi implementada nesta etapa.

#### Fonte aprovada

- **IBGE Localidades** — estados e municípios brasileiros, consumidos exclusivamente pelo
  servidor (`src/server/providers/ibge/client.ts`), sem chave de API. Dataset completo
  (`/estados` + `/municipios`) é buscado e cacheado em memória por 24h
  (`DATASET_TTL_MS = 24 * 60 * 60 * 1000`), com timeout de 8s por requisição
  (`FETCH_TIMEOUT_MS = 8000`) e limite de 8MB por resposta (`MAX_RESPONSE_BYTES`).
  Resultados de busca são limitados a 20 itens (`MAX_RESULTS`).
  - Observação de esquema: o campo legado `microrregiao.mesorregiao.UF` não está presente em
    todos os municípios (nulo para diversos municípios após reorganizações territoriais do
    IBGE). O provedor usa a cadeia estável `regiao-imediata.regiao-intermediaria.UF`, presente
    em 100% dos 5.571 municípios verificados em teste ao vivo.
  - O cache do dataset em memória (`MemoryTtlCache`) **não é compartilhado entre instâncias
    serverless da Vercel** — cada instância de função pode ter seu próprio cache local, o que
    é aceitável para esta fase mas deve ser considerado ao avaliar taxa de acerto de cache em
    produção.
  - Rate limit (`express-rate-limit` 8.6.2, `MemoryStore` padrão — em processo/instância):
    20 requisições/minuto por IP (`createRateLimiter(60 * 1000, 20)` em
    `src/server/middleware/rate-limit.ts`). O contador é mantido em memória do processo Node;
    **não há armazenamento externo compartilhado (Redis ou similar)**. Em ambiente serverless
    da Vercel, cada instância de função possui seu próprio contador — portanto o limite de
    20/min é **por processo/instância**, não um limite global agregado entre todas as
    instâncias simultâneas. Esta limitação é análoga à do cache do dataset IBGE (item acima) e
    deve ser considerada ao avaliar proteção real contra abuso em produção.
  - Endereço do cliente: determinado por `req.ip` do Express, que respeita a configuração
    `app.set('trust proxy', ...)` já existente em `src/server/entry.ts`
    (`TRUST_PROXY_HOPS`, padrão `1`). Essa configuração não foi alterada nesta etapa por
    falta de evidência documentada do número de saltos de proxy usado pela infraestrutura
    da Vercel para esta rota; qualquer ajuste deve ser feito com base em teste específico
    do ambiente de produção, não nesta fase.
  - Headers de rate limit confirmados em teste real (`standardHeaders: true`, RFC draft-7):
    `RateLimit-Policy`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` e, quando
    o limite é excedido, `Retry-After`. A resposta 429 é normalizada pelo handler da rota para
    JSON `{ ok:false, error }`, permitindo que o frontend trate o limite sem erro de parsing.

#### Próxima candidata

- **CPTEC/INPE** — previsão meteorológica e de ondas em XML. Uso condicionado a teste de
  disponibilidade e validação de contrato antes de qualquer integração.

### 2.2A — Homologação técnica e jurídica CPTEC/INPE (concluída sem integração)

Esta homologação foi executada em `2026-08-18T19:12:13-03:00`, na branch
`csas10-fase-2-2-homologacao-cptec`, somente contra HTTPS. Nenhuma rota, componente,
configuração Vercel ou comportamento público foi alterado. A documentação oficial consultada foi
`https://servicos.cptec.inpe.br/XML/`.

#### Endpoints oficiais e resultados observados

Todos os requests usaram método `GET`, `Invoke-WebRequest` com timeout de 30--45 segundos,
ambiente local Windows e região aproximada Brasil (UTC-03:00), tendo
`https://servicos.cptec.inpe.br/XML` como origem. Não houve redirecionamento observado. Todas
as respostas válidas vieram como `Content-Type: text/xml;charset=ISO-8859-1`, sem
`Content-Encoding` HTTP; o XML declara `encoding="ISO-8859-1"`.

| Produto | URL | Amostra | HTTP | Latência |
| --- | --- | --- | --- | --- |
| Localidades | `/listaCidades?city=<nome-sem-acentos>` | 9 solicitações: Salvador, Ilhéus, Porto Seguro, Recife, Fortaleza, Rio de Janeiro, Santos, Florianópolis e Brasília | 200 | mínimo 69 ms; máximo 314 ms |
| Meteorologia 7 dias | `/cidade/7dias/<cptec-id>/previsao.xml` | 8 solicitações, localidades costeiras | 200 | mínimo 99 ms; máximo 115 ms |
| Ondas diária | `/cidade/<cptec-id>/dia/0/ondas.xml` | 8 solicitações, localidades costeiras | 200 | mínimo 73 ms; máximo 273 ms |
| Ondas 6 dias | `/cidade/<cptec-id>/todos/tempos/ondas.xml` | 8 solicitações, localidades costeiras | 200 | mínimo 83 ms; máximo 100 ms |

As latências são evidências exclusivamente da janela de homologação, sem valor de SLA ou
garantia de disponibilidade ou desempenho futuro do provedor.

O endpoint de busca retornou `<cidades><cidade><nome/><uf/><id/></cidade></cidades>`. A
documentação orienta remover acentos no parâmetro e a busca funciona como prefixo. A resposta
não declara se a localidade é costeira.

O XML de meteorologia 7 dias tem raiz `<cidade>` e campos de primeiro nível `nome`, `uf`,
`atualizacao` e `previsao`. Cada `previsao` contém `dia`, `tempo`, `maxima`, `minima` e `iuv`.
`dia` e `atualizacao` usam `aaaa-mm-dd`; máximas e mínimas são graus Celsius inteiros; `iuv`
é o valor máximo diário de radiação ultravioleta; `tempo` é uma sigla CPTEC. A documentação
não declara timezone para a data de atualização.

O XML de ondas diária tem raiz `<cidade>`, `nome`, `uf`, `atualizacao` e os períodos
`manha`, `tarde` e `noite`. Cada período contém `dia`, `agitacao`, `altura`, `direcao`,
`vento` e `vento_dir`. `dia` usa `dd-mm-aaaa HHh Z` (UTC/Zulu), `altura` é metro decimal,
`vento` é km/h, `agitacao` é Fraco/Moderado/Forte e as direções são siglas cardeais.

O XML de ondas de 6 dias tem raiz `<cidade>`, `nome`, `uf`, `atualizacao` e vários nós
`previsao` (8 horários por dia, dia atual mais os cinco seguintes). Cada nó contém os mesmos
campos de ondas (`dia`, `agitacao`, `altura`, `direcao`, `vento`, `vento_dir`), com horários
`00/03/06/09/12/15/18/21h Z` em UTC/Zulu. A data de `atualizacao` observada usa
`aaaa-mm-dd`.

#### Requisitos técnicos para implementação futura

O charset ISO-8859-1 é requisito obrigatório. O futuro cliente não deve usar diretamente
`Response.text()`, pois essa API decodifica o corpo como UTF-8 e pode corromper nomes como
`Ilhéus`, `São Luís` e `Florianópolis`. A implementação deverá ler `ArrayBuffer`, aplicar limite
máximo de bytes, validar a declaração de encoding do XML e decodificar com
`TextDecoder('iso-8859-1', { fatal: true })` antes do parser:

```ts
const buffer = await response.arrayBuffer();

if (buffer.byteLength > MAX_RESPONSE_BYTES) {
  throw new HttpInvalidResponseError('CPTEC response exceeded size limit');
}

const xml = new TextDecoder('iso-8859-1', { fatal: true }).decode(buffer);
```

Deverá existir teste que confirme a preservação dos acentos. O parser XML deve manter DTD e
entidades externas desativados, evitando XXE.

HTTP 200 não significa dado semanticamente válido. A implementação futura deverá validar
separadamente transporte (status, timeout, tamanho e `Content-Type`) e semântica (cidade, UF,
datas, números, unidades e quantidade de registros). O parâmetro `dia` aceitará somente `0`,
`1` ou `2`; IDs CPTEC serão aceitos somente após mapeamento homologado; `null`, `undefined`,
`NaN` e datas inválidas nunca poderão chegar ao frontend. Resposta HTTP 200 inválida será
tratada como falha do provedor. Localidade sem cobertura marítima resultará em
`quality: 'unavailable'`, nunca em mar calmo ou risco baixo. Timeout deverá ser testado
futuramente com mock e `AbortController`, sem depender de provocar lentidão real no CPTEC.

Campos obrigatórios no contrato observado são os campos listados acima. Não foram encontrados
campos opcionais adicionais nos XML da amostra; elementos ausentes devem invalidar a resposta,
não receber valor padrão silencioso. A cobertura declarada pelo CPTEC é municípios/localidades
com previsão meteorológica e, para ondas, localidades litorâneas cobertas pelo modelo oceânico.
O provedor explicitamente não informa no resultado de busca se uma localidade é costeira.

#### Amostra de códigos e mapeamento explícito

Os identificadores CPTEC são distintos dos códigos IBGE e não podem ser associados
silenciosamente apenas pelo nome. O mapeamento futuro deve preservar ambos os códigos, a UF,
a fonte da associação e a evidência usada:

| Localidade | CPTEC | IBGE |
| --- | ---: | ---: |
| Salvador/BA | 242 | 2927408 |
| Ilhéus/BA | 2381 | 2913606 |
| Porto Seguro/BA | 4154 | 2925303 |
| Recife/PE | 239 | 2611606 |
| Fortaleza/CE | 229 | 2304400 |
| Rio de Janeiro/RJ | 241 | 3304557 |
| Santos/SP | 4748 | 3548500 |
| Florianópolis/SC | 228 | 4205407 |

O código deve ser resolvido primeiro pelo catálogo IBGE aprovado e depois por uma associação
explícita com o resultado CPTEC, nunca por igualdade numérica ou por nome isolado.

#### Falhas, indisponibilidade e localidade não costeira

- `https://servicos.cptec.inpe.br/XML/cidade/999999999/previsao.xml` respondeu HTTP 200,
  `text/xml`, mas com `nome`, `uf`, `atualizacao`, `dia`, `tempo`, `maxima` e `minima` como
  `null`. Isso é uma resposta inválida semanticamente e deve ser rejeitada.
- `.../cidade/224/dia/0/ondas.xml` para Brasília respondeu HTTP 200, mas com
  `undefined` e `00/00/0000 00:00:00`; deve ser rejeitada como não costeira/não coberta.
- `.../cidade/224/todos/tempos/ondas.xml` para Brasília respondeu HTTP 500.
- O caminho `.../cidade/242/dia/9/ondas.xml` respondeu HTTP 200 e entregou o mesmo formato de
  ondas; o provedor não validou o parâmetro `dia`, portanto o cliente não deve presumir que
  HTTP 200 significa que o parâmetro foi aceito.
- Não foi observada indisponibilidade espontânea durante a amostra. Um timeout de cliente
  controlado deve ser tratado como indisponibilidade/transporte, mas não foi usado para afirmar
  uma falha do CPTEC; erros HTTP 4xx/5xx e XML inválido devem ser registrados separadamente.

#### Contrato futuro proposto

Sem implementação nesta fase, o contrato ambiental futuro será:

```ts
interface Forecast<T> {
  value: T | null;
  quality: 'estimated' | 'unavailable';
  source: 'CPTEC/INPE';
  sourceUrl: string;
  issuedAt: string | null;
  validAt: string | null;
  validDate: string | null;
  fetchedAt: string;
  coverage: string | null;
  expiresAt: string | null;
  stale: boolean;
}
```

`issuedAt` poderá ser `null` quando o CPTEC informar somente a data. `validAt` será usado para
timestamps com timezone, como o horário UTC/Zulu das ondas. `validDate` será usado para datas
sem horário ou timezone, como a meteorologia diária. Para meteorologia diária, a data não será
convertida artificialmente em meia-noite UTC. `validAt` e `validDate` nunca coexistirão.
`expiresAt` será uma política do Minha Praia Segura, não necessariamente um campo fornecido pelo
CPTEC. `stale` será calculado a partir da validade e do momento atual. `coverage` deverá
informar “município/localidade costeira”, sem afirmar cobertura de uma praia específica.

As previsões CPTEC disponíveis serão classificadas como `estimated`; ausência, resposta inválida
ou falta de cobertura serão `unavailable`. As invariantes são: `estimated` implica `value` não
nulo e `unavailable` implica `value` nulo. Nenhum dado CPTEC será classificado como `real` ou
`demonstration`; falhas não serão convertidas em mar calmo ou risco baixo, nem permitirão
inferências sobre corrente de retorno ou segurança para banho.

#### Termos e status jurídico

A homologação técnica e sua documentação pública são permitidas. A exibição operacional dos
dados CPTEC/INPE no site permanece condicionada à confirmação dos termos aplicáveis. Uso
comercial ou reprodução em meios de divulgação exige autorização expressa, e toda utilização
deve atribuir a fonte como “CPTEC/INPE”. Recomenda-se obter manifestação escrita antes da
publicação operacional; esta homologação não autoriza ainda exibição no frontend nem exposição
por rota pública.

### 2.2B — Fundação interna CPTEC/INPE (implementada, sem integração pública)

A fundação interna foi implementada na branch `csas10-fase-2-2b-fundacao-cptec` e permanece
restrita ao servidor. O cliente não é importado por `src/server/entry.ts`, não cria endpoint
público, não altera o frontend e não solicita geolocalização. O mapeamento inicial contém
somente as localidades CPTEC ↔ IBGE homologadas na seção acima.

O contrato `Forecast<T>` é uma união discriminada: previsões válidas têm
`quality: 'estimated'` e `value` não nulo; indisponibilidade tem `quality: 'unavailable'` e
`value: null`. O cliente de baixo nível ainda lança erros tipados para timeout, XML inválido,
resposta HTTP inválida e falta de cobertura; uma camada futura será responsável por convertê-los
em `unavailable`.

Foram implementadas validações de transporte e semântica: limite de 512 KiB; charset
`ISO-8859-1` no header e na declaração XML; DTD/entidades externas bloqueados; sete registros
meteorológicos com datas únicas; três períodos diários nomeados e 48 registros de ondas de seis
dias com timestamps únicos; `atualizacao` válida; faixas conservadoras de temperatura
(-80 to 70 °C), IUV (0--20), altura de onda (0--30 m) e vento (0--300 km/h); coerência entre
mínima e máxima; direções da rosa dos ventos e agitação `Fraco`, `Moderado` ou `Forte`.

Esta fundação foi validada com lint, type-check, build, audit sem vulnerabilidades e 48 testes
automatizados. Ainda não entrega previsão por rota pública, não classifica dados como `real` ou
`demonstration`, não gera índice de risco e não faz inferências sobre segurança para banho.

### 2.2C — Normalização interna de indisponibilidade CPTEC/INPE

A camada `cptec-forecast` recebe exclusivamente códigos IBGE, resolve somente os oito
mapeamentos homologados e converte falhas conhecidas do cliente CPTEC de baixo nível em
`ForecastServiceResult<T>` discriminado. Sucessos preservam previsões `estimated`; falhas
produzem `quality: 'unavailable'`, `value: null`, datas e emissão nulas, `expiresAt: null` e
`stale: false`.

Os motivos internos são `timeout`, `upstream_http`, `invalid_response`,
`mapping_not_homologated` e `coverage_unavailable`. O resultado normalizado não expõe URL
interna, mensagem bruta, stack trace ou detalhes de infraestrutura. Cache, expiração e cálculo
de `stale` permanecem adiados para a Fase 2.2D, sem conversão artificial de `validDate`.
Esta camada não é importada pelo entrypoint, não cria rota pública e não altera frontend,
geolocalização, índices de risco, Vercel, Production ou `ENABLE_AGENTS`.
Os testes automatizados da suíte passaram de 48 para 57 com esta camada.

#### Fontes pendentes

- INMET;
- CHM/Marinha;
- catálogo oficial de praias;
- balneabilidade estadual ou municipal.

#### Fontes não autorizadas para produção neste momento

- endpoint público do Nominatim;
- scraping de páginas;
- APIs sem documentação;
- Open-Meteo gratuito para eventual uso comercial.

#### Contrato do endpoint

```
GET /api/locations/search?q=<termo>
```

- `q` obrigatório, aparado (trim), entre 2 e 80 caracteres — caso contrário, HTTP 400.
- Resposta de sucesso (200): `{ ok, query, source, sourceUrl, queriedAt, datasetFetchedAt, cache, coverage, results[] }`.
- `results[]` contém `{ id, name, type ('state'|'municipality'), ibgeCode, stateCode, stateName, source, sourceUrl }`.
- Indisponibilidade do provedor por timeout → HTTP 503; erro HTTP externo ou estrutura inválida → HTTP 502.
- Nenhuma stack trace ou detalhe interno é exposto ao cliente.
- Rate limit: 20 requisições/minuto por IP, resposta 429 em JSON (ver acima).

##### Exemplos reais (capturados em servidor local com build de produção)

HTTP 200 — com resultados (`?q=salvador`):
```json
{"ok":true,"query":"salvador","source":"IBGE - Localidades","sourceUrl":"https://servicodados.ibge.gov.br/api/docs/localidades","queriedAt":"2026-08-18T20:31:06.899Z","datasetFetchedAt":"2026-08-18T20:31:06.883Z","cache":"miss","coverage":"Estados e municípios do Brasil cadastrados na base de Localidades do IBGE.","results":[{"id":"municipio-2927408","name":"Salvador","type":"municipality","ibgeCode":"2927408","stateCode":"BA","stateName":"Bahia","source":"IBGE - Localidades","sourceUrl":"https://servicodados.ibge.gov.br/api/docs/localidades"}]}
```

HTTP 200 — sem resultados (`?q=zzznaoexiste`):
```json
{"ok":true,"query":"zzznaoexiste","source":"IBGE - Localidades","sourceUrl":"https://servicodados.ibge.gov.br/api/docs/localidades","queriedAt":"2026-08-18T20:31:06.956Z","datasetFetchedAt":"2026-08-18T20:31:06.883Z","cache":"hit","coverage":"Estados e municípios do Brasil cadastrados na base de Localidades do IBGE.","results":[]}
```

HTTP 400 — `q` ausente ou inválido:
```json
{"ok":false,"error":"O parâmetro \"q\" é obrigatório e deve ter entre 2 e 80 caracteres."}
```

HTTP 429 — limite excedido:
```json
{"ok":false,"error":"Muitas buscas foram realizadas em pouco tempo. Aguarde e tente novamente."}
```

Headers: `RateLimit-Policy: 20;w=60`, `RateLimit-Limit: 20`, `RateLimit-Remaining: 0`, `RateLimit-Reset: <segundos>`, `Retry-After: <segundos>`.

HTTP 502 — erro HTTP externo ou estrutura inválida do provedor (mensagem genérica, sem detalhe interno):
```json
{"ok":false,"error":"Não foi possível obter dados do provedor de localidades (IBGE) neste momento."}
```

HTTP 503 — timeout do provedor (mensagem genérica, sem detalhe interno):
```json
{"ok":false,"error":"O serviço de localidades está temporariamente indisponível (tempo de resposta excedido). Tente novamente em instantes."}
```

Todas as respostas de sucesso indicam fonte (`source`), URL da fonte (`sourceUrl`), horário da
consulta (`queriedAt`), horário de obtenção do dataset (`datasetFetchedAt`), estado de cache do
dataset (`cache`: `"hit"` ou `"miss"`) e cobertura (`coverage`).

#### Interface

- Componente `src/components/LocationSearch.tsx`, integrado à página inicial em
  `src/pages/index.tsx` sob o título honesto **"Buscar cidade ou estado"**.
- Não solicita geolocalização. Inclui aviso de que a busca por nome de praia depende de um
  catálogo oficial ainda não aprovado.
- Estados cobertos: ocioso, inválido, carregando, erro/indisponível, sem resultados e sucesso
  (com atribuição de fonte IBGE).

#### Limitações registradas

- Esta fase não entrega busca nominal de praias, condições do mar ou geolocalização.
- O cache do dataset em memória e o rate limit não são compartilhados entre instâncias
  serverless da Vercel (ver detalhes na seção "Fonte aprovada" acima).
- `Observation<T>`/`DataQuality` (`src/server/domain/observation.ts`) foram definidos para uso
  futuro em dados ambientais e **não são usados** para representar localidades nesta fase.

## Fase 3 — Serviços avançados

### 3.1 Autenticação
- Objetivo: permitir acesso controlado a recursos de usuário, sem abertura pública do sistema.
- Dependências: decisão de provedor, políticas de sessão, hash de senha, ou autenticação com SSO futuro e revisão de fluxo.
- Arquivos previstos: `src/server/auth/**`, `src/server/api/**`, `src/lib/session.ts`, `src/pages/login.tsx`.
- Riscos: autenticação fraca, credenciais expostas, sessão roubada, contorno de fallback e senhas em texto.
- Proteção de segurança e privacidade: uso de hash seguro, sessões com expiração, proteção de rotas e minimização de dados de usuário.
- Testes necessários: login válido, senha inválida, expiração de sessão, bloqueio de rotas e proteção de armazenamentos.
- Critério de aceite: somente usuários autenticados acessam áreas protegidas e o fluxo é auditável.
- Condição de rollback: se a autenticação não atender às políticas de segurança, remover o acesso e manter somente o piloto público.

### 3.2 Banco e isolamento por usuário
- Objetivo: armazenar dados em estrutura segura e separar o conteúdo por usuário ou domínio autorizado.
- Dependências: decisão de banco (relacional ou semiestruturado), migração de dados, políticas de acesso e governança.
- Arquivos previstos: `src/server/db/**`, `src/server/api/**`, `src/server/models/**`, `migrations/**`.
- Riscos: vazamento cruzado entre usuários, esquemas inadequados e ausência de retenção.
- Proteção de segurança e privacidade: permissão por usuário, criptografia de atributos sensíveis, segredos em ambiente e revisão de leitura/escrita.
- Testes necessários: criação de usuário, isolamento de dados, exclusão de conta, validação de acesso e backup seguro.
- Critério de aceite: nenhum usuário acessa dados de outro usuário e o armazenamento é auditável.
- Condição de rollback: se não houver isolamento correto, suspender o módulo e manter apenas dados públicos do piloto.

### 3.3 Exclusão de conta
- Objetivo: permitir que usuário remova seus dados conforme o princípio de privacidade e direito de eliminação.
- Dependências: política de privacidade, fluxo de confirmação, regras de retenção e procedimento de governança.
- Arquivos previstos: `src/pages/account-delete.tsx`, `src/server/api/user/delete.ts`, `src/server/db/**`.
- Riscos: exclusão parcial, ausência de confirmação, retenção indevida e conflito de backup.
- Proteção de segurança e privacidade: confirmação de identidade, exclusão de dados principais e retenção mínima em backups e logs.
- Testes necessários: fluxo completo de exclusão, revalidação de login e verificação de remoção permanente do conteúdo.
- Critério de aceite: usuário consegue excluir conta e dados associados sem risco de acessos remanescentes.
- Condição de rollback: se a exclusão não for robusta, desativar o fluxo e manter o estado atual do piloto público.

### 3.4 Aceite legal auditável
- Objetivo: registrar a versão da Política de Privacidade e dos Termos aceita pelo usuário quando uma funcionalidade exigir concordância.
- Dependências: autenticação, banco, versionamento dos documentos e histórico de vigência.
- Dados mínimos: usuário, documento, versão, data/hora e origem do aceite.
- Proteção: não utilizar caixas previamente marcadas e não considerar silêncio ou simples navegação como consentimento.
- Testes: novo aceite, versão atualizada, recusa e revogação quando aplicável.
- Critério de aceite: cada concordância necessária possui versão e evidência auditável.
- Condição de rollback: impedir o recurso dependente sem apagar o histórico legal válido.

### 3.5 Dashboards
- Objetivo: disponibilizar visão operativa para usuários autorizados, sem expor dados internos de forma pública.
- Dependências: autenticação, banco, filtros por usuário e revisão de qualquer dado sensível.
- Arquivos previstos: `src/pages/dashboard.tsx`, `src/server/api/dashboard/**`, `src/components/**`.
- Riscos: vazamento de dados internos, acessos inadequados, autorização incompleta e UX complexa.
- Proteção de segurança e privacidade: dashboards restritos ao usuário ou a função autorizada, sem dados públicos embutidos.
- Testes necessários: acesso autorizado, acesso negado, filtros, estados vazios e auditoria.
- Critério de aceite: somente usuários com perfil adequado acessam dashboards, com visibilidade e organização corretas.
- Condição de rollback: se o dashboard expuser dados sem controle, retornar à versão sem dashboard e eliminar o acesso.

### 3.6 Aplicativo móvel
- Objetivo: expandir a experiência para dispositivos móveis em uma etapa posterior e controlada, sem abrir o serviço antes da revisão de segurança.
- Dependências: revisão da interface responsiva, backend pronto, arquitetura de API e alinhamento com políticas de privacidade.
- Arquivos previstos: `mobile/**` ou repositório separado, integrações de API e documentação de compatibilidade.
- Riscos: duplicação de fluxo, insegurança em dispositivos, sincronização inadequada e maior superfície de ataque.
- Proteção de segurança e privacidade: revisão dos requisitos de armazenamento local, tokens, criptografia e autorização.
- Testes necessários: autenticação, armazenamento seguro, sincronização e fluxo de dados sensíveis.
- Critério de aceite: app móvel apenas após revisão de segurança, privacidade e consentimento.
- Condição de rollback: se a segurança não for adequada, bloquear a liberação do app e manter somente o site web.

### 3.7 Agentes apenas em laboratório privado
- Objetivo: manter a exploração de agentes em ambiente privado, controlado e sem acesso público.
- Dependências: autenticação, autorização, banco, orçamento, limites e políticas de retenção; ambiente isolado e revisão legal.
- Arquivos previstos: `src/server/agents/**`, `src/server/auth/**`, `src/server/db/**`, `src/pages/lab/**`, configuração de ambiente.
- Riscos: vazamento de dados, prompt injection, uso financeiro não controlado, armazenamento indevido e acesso público.
- Proteção de segurança e privacidade: modelos permitidos definidos pelo servidor; limites de tamanho de entrada e saída; moderação; `safety_identifier` pseudonimizado; cotas por usuário e limite financeiro global; prazo de retenção e exclusão; tratamento de erros sem expor respostas internas do provedor; testes contra prompt injection; revisão humana em resultados relacionados à segurança marítima; sem `ENABLE_AGENTS` no ambiente público; nenhum acesso externo; prompts e respostas tratados com retenção controlada; logs segregados; cobrança e orçamento definidos; revisão contínua de prompts.
- Testes necessários: autenticação, isolamento de usuário, prompt segurança, rate limiting, orçamento, logs e banco de dados com retenção definida; validação de allowlist de modelos; limites de entrada e saída; moderação; prompt injection; respostas seguras sem vazamento interno.
- Critério de aceite: laboratório privado opera apenas para usuários autorizados e sem qualquer superfície pública.
- Condição de rollback: se houver risco funcional ou de privacidade, remover a interface e desativar o módulo completamente.

## Critérios cruzados

- A Fase 2 somente começa após aprovação formal dos critérios da Fase 1.
- A Fase 3 somente começa após estabilidade e revisão dos dados da Fase 2.
- Cada fase deve possuir branch própria, revisão de código, backup e rollback.
- A publicação exige lint, tipos, testes, build, auditoria de dependências e validação HTTP.
- Ausência ou atraso de dados nunca pode ser convertido em “risco baixo”.
- Todo dado operacional deve possuir fonte, horário, cobertura e limite de validade configurado por fonte.
- Nenhuma funcionalidade nova deve ser liberada sem revisão de privacidade e segurança.
- Qualquer integração externa deve obedecer a política de servidor, não frontend.
- Nenhuma tela pode afirmar dados reais, monitoramento em tempo real, alerta oficial ou sucesso de envio sem backend funcional comprovado.
- Qualquer decisão com risco de vida deve ser claramente marcada como informação de apoio, não como avaliação técnica oficial.
- Em cada fase, o rollback deve ser possível sem perder a base institucional já validada do piloto.
