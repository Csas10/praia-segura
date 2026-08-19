import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../entry';
import { __resetIbgeDatasetCacheForTests } from '../providers/ibge/client';

const ESTADOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const MUNICIPIOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';

const realFetch: typeof fetch = global.fetch.bind(global);

function mockSuccessfulFetch() {
  return vi.fn(async (url: string, init?: Parameters<typeof fetch>[1]) => {
    if (url === ESTADOS_URL) {
      return new Response(JSON.stringify([{ id: 29, sigla: 'BA', nome: 'Bahia' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url === MUNICIPIOS_URL) {
      return new Response(
        JSON.stringify([
          {
            id: 2927408,
            nome: 'Salvador',
            'regiao-imediata': {
              'regiao-intermediaria': { UF: { sigla: 'BA', nome: 'Bahia' } },
            },
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    return realFetch(url, init);
  });
}

let httpServer: ReturnType<ReturnType<typeof createApp>['listen']>;
let baseUrl = '';
let tempClientDir = '';

beforeAll(async () => {
  tempClientDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mps-ratelimit-'));
  fs.writeFileSync(path.join(tempClientDir, 'index.html'), '<!doctype html><html><body>ok</body></html>');
  __resetIbgeDatasetCacheForTests();

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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('/api/locations/search rate limit', () => {
  it('returns 429 after exceeding the per-minute limit for a single client', async () => {
    vi.stubGlobal('fetch', mockSuccessfulFetch());

    const statuses: number[] = [];
    let limitedResponse: Response | undefined;
    // The route allows 20 requests/minute per IP; issue 25 to guarantee a 429.
    for (let i = 0; i < 25; i += 1) {
      const response = await fetch(`${baseUrl}/api/locations/search?q=Salvador`);
      statuses.push(response.status);
      if (response.status === 429) {
        limitedResponse = response;
      }
    }

    expect(statuses).toContain(429);
    expect(limitedResponse).toBeDefined();
    expect(limitedResponse?.headers.get('content-type')).toMatch(/application\/json/i);
    expect(limitedResponse?.headers.get('ratelimit-limit')).toBe('20');
    expect(limitedResponse?.headers.get('ratelimit-remaining')).toBe('0');
    expect(limitedResponse?.headers.get('ratelimit-reset')).toBeTruthy();
    expect(limitedResponse?.headers.get('retry-after')).toBeTruthy();
    await expect(limitedResponse?.json()).resolves.toEqual({
      ok: false,
      error: 'Muitas buscas foram realizadas em pouco tempo. Aguarde e tente novamente.',
    });
  }, 20000);

  it('applies the same JSON rate limit contract to CPTEC forecasts', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: Parameters<typeof fetch>[1]) => {
      if (url.startsWith('http://127.0.0.1')) return realFetch(url, init);
      throw new Error('upstream unavailable');
    }));

    let limitedResponse: Response | undefined;
    for (let i = 0; i < 25; i += 1) {
      const response = await fetch(`${baseUrl}/api/forecasts?ibgeId=2927408&product=weather-7d`);
      if (response.status === 429) limitedResponse = response;
    }

    expect(limitedResponse).toBeDefined();
    expect(limitedResponse?.headers.get('content-type')).toMatch(/application\/json/i);
    expect(limitedResponse?.headers.get('ratelimit-limit')).toBe('20');
    expect(limitedResponse?.headers.get('retry-after')).toBeTruthy();
    expect(limitedResponse?.headers.get('cache-control')).toBe('no-store');
    await expect(limitedResponse?.json()).resolves.toMatchObject({ ok: false });
  }, 20000);
});
