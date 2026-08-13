# Correções e implantação — Minha Praia Segura

Data da revisão: 13 de agosto de 2026

## Causa da indisponibilidade

O pacote recebido não estava pronto para iniciar em um ambiente de contêiner:

- o `package-lock.json` não correspondia ao `package.json`, fazendo `npm ci` falhar;
- não existia o script `npm start` esperado pela maioria das plataformas;
- não havia `Dockerfile` nem health check;
- o servidor confiava em qualquer cabeçalho de proxy, o que era rejeitado pelo
  limitador de requisições e permitia contornar a limitação por IP;
- as rotas `/privacy` e `/terms` apontadas no rodapé não existiam;
- a página de erro respondia HTTP 200 para endereços inexistentes.

## Correções aplicadas

- lockfile sincronizado e instalação limpa validada com Node.js 22;
- script de produção `npm start` incluído;
- imagem Docker multi-stage, execução sem privilégios e health check em
  `/api/health`;
- quantidade de proxies confiáveis limitada por `TRUST_PROXY_HOPS` (padrão: 1);
- Política de Privacidade e Termos de Uso integrados ao React, SSR e sitemap;
- rota desconhecida corrigida para responder HTTP 404;
- configuração do ESLint corrigida;
- idioma do documento HTML alterado para `pt-BR`.

## Implantação com Docker

```bash
docker build -t minha-praia-segura .
docker run --rm -p 3000:3000 -e PORT=3000 minha-praia-segura
```

Em uma plataforma gerenciada, publique o repositório com o `Dockerfile`. A
plataforma deve encaminhar o domínio para a porta informada em `PORT`.

## Implantação sem Docker

Use Node.js 22 ou superior e configure:

- comando de build: `npm ci && npm run build`
- comando de início: `npm start`
- health check: `/api/health`
- variável `HOST`: `0.0.0.0`
- variável `TRUST_PROXY_HOPS`: quantidade real de proxies reversos (normalmente 1)

Não fixe manualmente a porta se a hospedagem fornece `PORT` automaticamente.

## Validação realizada

- `npm ci`: aprovado;
- `npm run lint`: aprovado;
- `npm run type-check`: aprovado;
- `npm test -- --run`: 2 testes aprovados;
- `npm run build`: aprovado (cliente e SSR);
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades;
- `/`, `/privacy`, `/terms` e `/api/health`: HTTP 200;
- rota inexistente: HTTP 404.

## Decisão sobre Git

| Ação | Autorização |
| --- | --- |
| Commit de checkpoint na branch | Permitido, se necessário para preservar trabalho |
| Push da branch | Permitido |
| Abrir PR como rascunho | Permitido |
| Merge em main | Bloqueado |
| Deploy público | Bloqueado |
| Ativar ENABLE_AGENTS | Bloqueado |

Depois do deploy, confirme que o domínio `minhapraiasegura.com.br` está ligado
ao serviço correto e que o balanceador considera `/api/health` saudável.
