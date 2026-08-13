# Minha Praia Segura

Este repositório contém o piloto do site institucional e da experiência pública da Minha Praia Segura, com foco em apresentação, políticas, conteúdo legal e uma base segura para validação de produto.

## Visão geral

A aplicação é um site público em React + Express com renderização SSR, voltado para:

- apresentar a proposta do projeto e sua finalidade institucional;
- disponibilizar páginas de privacidade e termos;
- manter a experiência pública simples, estável e segura;
- deixar a funcionalidade de agentes de IA desativada por padrão, com flag de ambiente explícita.

## Estado atual do piloto

O piloto atual foi ajustado para evitar exposição pública indevida de agentes de IA. O comportamento seguro é:

- `process.env.ENABLE_AGENTS === 'true'`
- sem variável configurada, `/agents` e `/api/agents` retornam 404;
- a navegação pública não expõe a rota de agentes;
- os dados exibidos em destaque são apresentados como demonstrativos e não oficiais.

## Stack

- React 19
- TypeScript
- Vite
- Express
- SSR do servidor
- Vitest para testes
- ESLint e TypeScript para validação

## Scripts

```bash
npm ci
npm run lint
npm run type-check
npm test -- --run
npm run build
npm audit --omit=dev --audit-level=high
```

## Estrutura principal

```text
src/
  pages/
    index.tsx
    privacy.tsx
    terms.tsx
  routes.tsx
  layouts/
  server/
public/
  robots.txt
  sitemap.xml
  favicon.svg
```

## Observações de operação

- O projeto cobre a camada pública e os documentos legais essenciais.
- A funcionalidade de agentes permanece desativada por padrão até que autenticação, isolamento por usuário e políticas de retenção sejam implementadas.
- O domínio principal considerado para a navegação pública é `https://minhapraiasegura.com.br`.

## Segurança

- chave da API do provedor não deve ficar exposta no front-end;
- variáveis sensíveis devem seguir ambiente de servidor e configuração da infraestrutura;
- a superfície pública de agentes não deve ser habilitada sem revisão de autenticação e segurança.


