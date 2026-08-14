import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AddressInfo } from 'net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CookieConsent from '../components/CookieConsent';
import Footer from '../layouts/parts/Footer';
import Header from '../layouts/parts/Header';
import AboutPage from '../pages/about';
import ContactPage from '../pages/contact';
import DocsPage from '../pages/docs';
import HomePage from '../pages';
import PrivacyPage from '../pages/privacy';
import { createApp } from '../server/entry';

let httpServer: ReturnType<ReturnType<typeof createApp>['listen']>;
let baseUrl = '';
let tempClientDir = '';

beforeAll(async () => {
  // create a temporary client dir with index.html and the docs files so tests do not depend on dist
  tempClientDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mps-client-'));
  fs.writeFileSync(path.join(tempClientDir, 'index.html'), '<!doctype html><html><body><div id="root">ok</div></body></html>');
  fs.mkdirSync(path.join(tempClientDir, 'docs'));
  fs.copyFileSync(path.join(process.cwd(), 'public', 'docs', 'guia-do-piloto-institucional.txt'), path.join(tempClientDir, 'docs', 'guia-do-piloto-institucional.txt'));
  fs.copyFileSync(path.join(process.cwd(), 'public', 'docs', 'checklist-conformidade.txt'), path.join(tempClientDir, 'docs', 'checklist-conformidade.txt'));

  // ensure tests run with agents disabled by default
  // delete any existing ENABLE_AGENTS in the test process
  delete process.env.ENABLE_AGENTS;

  const app = createApp(tempClientDir);
  httpServer = app.listen(0);
  await once(httpServer, 'listening');
  const addr = httpServer.address();
  // address may be AddressInfo
  const port = typeof addr === 'object' && addr !== null ? (addr as AddressInfo).port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  // cleanup temp client dir
  try {
    fs.rmSync(tempClientDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

beforeEach(() => {
  window.localStorage.clear();
});

describe('Minha Praia Segura', () => {
  it('renders the landing page hero', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Plataforma de apoio à segurança costeira em desenvolvimento/i)).toBeInTheDocument();
  });

  it('renders the institutional pages', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Uma base institucional clara para o piloto/i })).toBeInTheDocument();

    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /contato@minhapraiasegura.com.br/i })).toHaveAttribute('href', 'mailto:contato@minhapraiasegura.com.br');

    render(
      <MemoryRouter>
        <DocsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Arquivos públicos e materiais de referência/i })).toBeInTheDocument();
  });

  it('renders the privacy policy page', () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Política de Privacidade/i })).toBeInTheDocument();
  });

  it('renders the main public navigation and footer actions', () => {
    render(
      <MemoryRouter>
        <>
          <Header />
          <Footer />
        </>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: /sobre/i })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /documentação/i })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /contato/i })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /preferências de cookies/i })).toBeInTheDocument();
  });

  it('opens, accepts, reopens and persists cookie consent choices', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('other-data', 'safe');

    const { rerender } = render(
      <MemoryRouter>
        <>
          <CookieConsent />
          <Footer />
        </>
      </MemoryRouter>,
    );

    expect(screen.getByRole('dialog', { name: /consentimento de cookies/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /aceitar/i }));
    expect(window.localStorage.getItem('mps_cookie_consent_v1')).toBe('accepted');
    expect(window.localStorage.getItem('other-data')).toBe('safe');
    expect(screen.queryByRole('dialog', { name: /consentimento de cookies/i })).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <>
          <CookieConsent />
          <Footer />
        </>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /preferências de cookies/i }));
    expect(screen.getByRole('dialog', { name: /consentimento de cookies/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /rejeitar/i }));
    expect(window.localStorage.getItem('mps_cookie_consent_v1')).toBe('declined');
    expect(screen.queryByRole('dialog', { name: /consentimento de cookies/i })).not.toBeInTheDocument();
  });

  it('does not throw when localStorage.getItem/setItem throw', async () => {
    const user = userEvent.setup();

    const originalGet = window.localStorage.getItem;
    const originalSet = window.localStorage.setItem;

    try {
      // simulate storage throwing (some private modes)
      // deliberately overwrite storage for testing
      (window.localStorage as unknown as { getItem: () => string }).getItem = () => { throw new Error('storage error'); };
      (window.localStorage as unknown as { setItem: (k: string, v: string) => void }).setItem = () => { throw new Error('storage error'); };

      render(
        <MemoryRouter>
          <>
            <CookieConsent />
            <Footer />
          </>
        </MemoryRouter>,
      );

      expect(screen.getByRole('dialog', { name: /consentimento de cookies/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /aceitar/i }));
      // setItem threw, but component should not crash and should hide the dialog
      expect(screen.queryByRole('dialog', { name: /consentimento de cookies/i })).not.toBeInTheDocument();
    } finally {
      window.localStorage.getItem = originalGet;
      window.localStorage.setItem = originalSet;
    }
  });

  it('serves the public routes over HTTP and blocks disabled agent endpoints', async () => {
    const publicRoutes = ['/', '/about', '/contact', '/docs', '/privacy', '/terms'];

    for (const path of publicRoutes) {
      if (path === '/docs') {
        const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
        expect(response.status).toBe(200);
      } else {
        const response = await fetch(`${baseUrl}${path}`);
        expect(response.status).toBe(200);
      }
    }

    expect((await fetch(`${baseUrl}/agents`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/agents`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/health`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/nao-existe`)).status).toBe(404);
  });
});
