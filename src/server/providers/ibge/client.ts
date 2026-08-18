import { z } from 'zod';
import { fetchJsonWithTimeout } from '../../http/fetch-with-timeout';
import { MemoryTtlCache } from '../../cache/memory-cache';
import type { LocationResult } from '../../domain/location';

/**
 * Server-side provider for the official IBGE "Localidades" API.
 * https://servicodados.ibge.gov.br/api/docs/localidades
 *
 * The provider URL is fixed internally — it is never derived from user
 * input. No API key is required or used by this provider.
 */

const SOURCE_NAME = 'IBGE - Localidades';
const SOURCE_URL = 'https://servicodados.ibge.gov.br/api/docs/localidades';

const ESTADOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const MUNICIPIOS_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';

// The full country dataset (states + municipalities) is fetched at most once
// per TTL window and reused for every search, per the requirement of a
// 24h cache. See MemoryTtlCache for the Vercel serverless caveat.
const DATASET_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
// The municipios payload is a few MB; this ceiling protects against a
// runaway/unexpected upstream response while still allowing the real payload.
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const MAX_RESULTS = 20;

const estadoSchema = z.object({
  id: z.number(),
  sigla: z.string().min(1),
  nome: z.string().min(1),
});

const municipioSchema = z.object({
  id: z.number(),
  nome: z.string().min(1),
  'regiao-imediata': z.object({
    'regiao-intermediaria': z.object({
      UF: z.object({
        sigla: z.string().min(1),
        nome: z.string().min(1),
      }),
    }),
  }),
});

const estadosResponseSchema = z.array(estadoSchema);
const municipiosResponseSchema = z.array(municipioSchema);

type Estado = z.infer<typeof estadoSchema>;
type Municipio = z.infer<typeof municipioSchema>;

interface Dataset {
  estados: Estado[];
  municipios: Municipio[];
  fetchedAt: string;
}

const datasetCache = new MemoryTtlCache<Dataset>(DATASET_TTL_MS);
const DATASET_CACHE_KEY = 'ibge-dataset';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

async function loadDataset(): Promise<{ dataset: Dataset; cacheState: 'hit' | 'miss' }> {
  const cached = datasetCache.get(DATASET_CACHE_KEY);
  if (cached) {
    return { dataset: cached, cacheState: 'hit' };
  }

  const [estados, municipios] = await Promise.all([
    fetchJsonWithTimeout(ESTADOS_URL, { timeoutMs: FETCH_TIMEOUT_MS, maxResponseBytes: MAX_RESPONSE_BYTES }, (data) =>
      estadosResponseSchema.parse(data),
    ),
    fetchJsonWithTimeout(MUNICIPIOS_URL, { timeoutMs: FETCH_TIMEOUT_MS, maxResponseBytes: MAX_RESPONSE_BYTES }, (data) =>
      municipiosResponseSchema.parse(data),
    ),
  ]);

  const dataset: Dataset = {
    estados,
    municipios,
    fetchedAt: new Date().toISOString(),
  };

  datasetCache.set(DATASET_CACHE_KEY, dataset);

  return { dataset, cacheState: 'miss' };
}

export interface SearchLocationsResult {
  results: LocationResult[];
  datasetFetchedAt: string;
  cacheState: 'hit' | 'miss';
}

/**
 * Searches IBGE states and municipalities by name (accent- and
 * case-insensitive substring match). Returns at most MAX_RESULTS entries.
 *
 * Throws HttpTimeoutError / HttpStatusError / HttpInvalidResponseError when
 * the upstream IBGE API is unreachable, errors, or returns an unexpected
 * structure — callers must not convert those failures into a silent empty
 * result.
 */
export async function searchLocations(query: string): Promise<SearchLocationsResult> {
  const { dataset, cacheState } = await loadDataset();
  const normalizedQuery = normalize(query);
  const results: LocationResult[] = [];

  for (const estado of dataset.estados) {
    if (results.length >= MAX_RESULTS) break;

    const matchesName = normalize(estado.nome).includes(normalizedQuery);
    const matchesSigla = normalize(estado.sigla) === normalizedQuery;

    if (matchesName || matchesSigla) {
      results.push({
        id: `estado-${estado.id}`,
        name: estado.nome,
        type: 'state',
        ibgeCode: String(estado.id),
        stateCode: estado.sigla,
        stateName: estado.nome,
        source: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
      });
    }
  }

  for (const municipio of dataset.municipios) {
    if (results.length >= MAX_RESULTS) break;

    if (normalize(municipio.nome).includes(normalizedQuery)) {
      const uf = municipio['regiao-imediata']['regiao-intermediaria'].UF;
      results.push({
        id: `municipio-${municipio.id}`,
        name: municipio.nome,
        type: 'municipality',
        ibgeCode: String(municipio.id),
        stateCode: uf.sigla,
        stateName: uf.nome,
        source: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
      });
    }
  }

  return {
    results: results.slice(0, MAX_RESULTS),
    datasetFetchedAt: dataset.fetchedAt,
    cacheState,
  };
}

/** Test-only helper to reset the module-level dataset cache between tests. */
export function __resetIbgeDatasetCacheForTests(): void {
  datasetCache.clear();
}
