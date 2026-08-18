import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../../entry';
import { __resetIbgeDatasetCacheForTests } from '../../../providers/ibge/client';

const ESTADOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const MUNICIPIOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';

const validEstados = [{ id: 29, sigla: 'BA', nome: 'Bahia' }];
const validMunicipios = [
  {
    id: 2927408,
    nome: 'Salvador',
    'regiao-imediata': {
      'regiao-intermediaria': { UF: { sigla: 'BA', nome: 'Bahia' } },
    },
  },
];

const realFetch: typeof fetch = global.fetch.bind(global);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function mockSuccessfulFetch() {
  return vi.fn(async (url: string, init?: Parameters<typeof fetch>[1]) => {
    if (url === ESTADOS_URL) return jsonResponse(validEstados);
    if (url === MUNICIPIOS_URL) return jsonResponse(validMunicipios);
    return realFetch(url, init);
  });
}

let httpServer: ReturnType<ReturnType<typeof createApp>['listen']>;
let baseUrl = '';
let tempClientDir = '';

beforeAll(async () => {
  tempClientDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mps-locations-'));
  fs.writeFileSync(path.join(tempClientDir, 'index.html'), '<!doctype html><html><body>ok</body></html>');
  delete process.env.ENABLE_AGENTS;

  const app = createApp(tempClientDir);
  httpServer = app.listen(0);
  await once(httpServer, 'listening');
  const addr = httpServer.address();
  const port = typeof addr === 'object' && addr !== null ? (addr as AddressInfo).port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => (error ? reject(error) : resolve()));
  });
  fs.rmSync(tempClientDir, { recursive: true, force: true });
});

beforeEach(() => {
  __resetIbgeDatasetCacheForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /api/locations/search', () => {
  it('returns 400 when q is missing', async () => {
    const response = await fetch(`${baseUrl}/api/locations/search`);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
  });

  it('returns 400 when q is shorter than 2 characters', async () => {
    const response = await fetch(`${baseUrl}/api/locations/search?q=a`);
    expect(response.status).toBe(400);
  });

  it('returns 400 when q is longer than 80 characters', async () => {
    const response = await fetch(`${baseUrl}/api/locations/search?q=${'a'.repeat(81)}`);
    expect(response.status).toBe(400);
  });

  it('returns 200 with normalized results on a valid query', async () => {
    vi.stubGlobal('fetch', mockSuccessfulFetch());

    const response = await fetch(`${baseUrl}/api/locations/search?q=Salvador`);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.source).toBe('IBGE - Localidades');
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results[0]).toMatchObject({ name: 'Salvador', type: 'municipality', stateCode: 'BA' });
  });

  it('returns 502 when the IBGE provider errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: Parameters<typeof fetch>[1]) => {
        if (url.includes('ibge.gov.br')) return jsonResponse({ error: 'boom' }, 500);
        return realFetch(url, init);
      }),
    );

    const response = await fetch(`${baseUrl}/api/locations/search?q=Salvador`);
    expect(response.status).toBe(502);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).not.toMatch(/at .*\.ts:\d+/); // no stack trace leaked
  });

  it('returns 502 when the IBGE provider returns an invalid structure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: Parameters<typeof fetch>[1]) => {
        if (url === ESTADOS_URL) return jsonResponse(validEstados);
        if (url === MUNICIPIOS_URL) return jsonResponse([{ id: 1, nome: 'Sem UF' }]);
        return realFetch(url, init);
      }),
    );

    const response = await fetch(`${baseUrl}/api/locations/search?q=Salvador`);
    expect(response.status).toBe(502);
  });

  it('does not leak stack traces on unexpected failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: Parameters<typeof fetch>[1]) => {
        if (url.includes('ibge.gov.br')) {
          throw new Error('unexpected failure with a stack trace');
        }
        return realFetch(url, init);
      }),
    );

    const response = await fetch(`${baseUrl}/api/locations/search?q=Salvador`);
    expect([502, 503]).toContain(response.status);
    const text = await response.text();
    expect(text).not.toContain(path.join('src', 'server'));
  });

  it('keeps /agents, /api/agents, /api/health and institutional routes unaffected', async () => {
    expect((await fetch(`${baseUrl}/agents`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/agents`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/health`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/nao-existe`)).status).toBe(404);
  });
});
