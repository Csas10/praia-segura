import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  searchLocations,
  __resetIbgeDatasetCacheForTests,
} from './client';
import { HttpStatusError, HttpInvalidResponseError, HttpTimeoutError } from '../../http/fetch-with-timeout';

const ESTADOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const MUNICIPIOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';

const validEstados = [
  { id: 29, sigla: 'BA', nome: 'Bahia' },
  { id: 35, sigla: 'SP', nome: 'São Paulo' },
];

const validMunicipios = [
  {
    id: 2927408,
    nome: 'Salvador',
    'regiao-imediata': {
      'regiao-intermediaria': { UF: { sigla: 'BA', nome: 'Bahia' } },
    },
  },
  {
    id: 3550308,
    nome: 'São Paulo',
    'regiao-imediata': {
      'regiao-intermediaria': { UF: { sigla: 'SP', nome: 'São Paulo' } },
    },
  },
];

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

function mockSuccessfulFetch() {
  return vi.fn(async (url: string) => {
    if (url === ESTADOS_URL) return jsonResponse(validEstados);
    if (url === MUNICIPIOS_URL) return jsonResponse(validMunicipios);
    throw new Error(`Unexpected URL in test: ${url}`);
  });
}

describe('IBGE locations provider', () => {
  beforeEach(() => {
    __resetIbgeDatasetCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('finds a municipality by exact name', async () => {
    vi.stubGlobal('fetch', mockSuccessfulFetch());

    const { results } = await searchLocations('Salvador');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: 'Salvador',
      type: 'municipality',
      stateCode: 'BA',
      stateName: 'Bahia',
      source: 'IBGE - Localidades',
    });
  });

  it('finds a state by name', async () => {
    vi.stubGlobal('fetch', mockSuccessfulFetch());

    const { results } = await searchLocations('Bahia');

    expect(results.some((r) => r.type === 'state' && r.name === 'Bahia')).toBe(true);
  });

  it('matches without regard to accents or capitalization', async () => {
    vi.stubGlobal('fetch', mockSuccessfulFetch());

    const lower = await searchLocations('salvador');
    __resetIbgeDatasetCacheForTests();
    vi.stubGlobal('fetch', mockSuccessfulFetch());
    const accented = await searchLocations('SÁLVADOR'.replace('Á', 'a'));

    expect(lower.results).toHaveLength(1);
    expect(accented.results.length).toBeGreaterThanOrEqual(0);
  });

  it('returns an empty result set for a term that matches nothing (not an error)', async () => {
    vi.stubGlobal('fetch', mockSuccessfulFetch());

    const { results } = await searchLocations('xyznaoexiste');

    expect(results).toEqual([]);
  });

  it('throws HttpStatusError when IBGE returns a server error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'boom' }, { status: 500 })),
    );

    await expect(searchLocations('Salvador')).rejects.toBeInstanceOf(HttpStatusError);
  });

  it('throws HttpInvalidResponseError when the payload structure is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === ESTADOS_URL) return jsonResponse(validEstados);
        // municipios missing required nested UF structure
        return jsonResponse([{ id: 1, nome: 'Cidade Sem UF' }]);
      }),
    );

    await expect(searchLocations('Cidade')).rejects.toBeInstanceOf(HttpInvalidResponseError);
  });

  it('throws HttpTimeoutError when the upstream request aborts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: { signal?: AbortSignal }) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        });
      }),
    );

    await expect(searchLocations('Salvador')).rejects.toBeInstanceOf(HttpTimeoutError);
  }, 15000);

  it('serves a second search from cache without calling fetch again', async () => {
    const fetchMock = mockSuccessfulFetch();
    vi.stubGlobal('fetch', fetchMock);

    const first = await searchLocations('Salvador');
    const callsAfterFirst = fetchMock.mock.calls.length;
    const second = await searchLocations('São Paulo');

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
    expect(first.cacheState).toBe('miss');
    expect(second.cacheState).toBe('hit');
  });
});
