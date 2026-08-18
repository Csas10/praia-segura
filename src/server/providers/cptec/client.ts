import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { HttpInvalidResponseError, HttpStatusError, HttpTimeoutError } from '../../http/fetch-with-timeout';
import { createEstimatedForecast } from '../../domain/forecast';
import type { Forecast } from '../../domain/forecast';

const SOURCE = 'CPTEC/INPE' as const;
const BASE_URL = 'https://servicos.cptec.inpe.br/XML';
const FETCH_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 512 * 1024;
const COVERAGE = 'município/localidade costeira';

export interface CptecLocationMapping {
  ibgeCode: string;
  cptecCode: number;
  name: string;
  stateCode: string;
}

export const HOMOLOGATED_LOCATIONS: readonly CptecLocationMapping[] = [
  { ibgeCode: '2927408', cptecCode: 242, name: 'Salvador', stateCode: 'BA' },
  { ibgeCode: '2913606', cptecCode: 2381, name: 'Ilhéus', stateCode: 'BA' },
  { ibgeCode: '2925303', cptecCode: 4154, name: 'Porto Seguro', stateCode: 'BA' },
  { ibgeCode: '2611606', cptecCode: 239, name: 'Recife', stateCode: 'PE' },
  { ibgeCode: '2304400', cptecCode: 229, name: 'Fortaleza', stateCode: 'CE' },
  { ibgeCode: '3304557', cptecCode: 241, name: 'Rio de Janeiro', stateCode: 'RJ' },
  { ibgeCode: '3548500', cptecCode: 4748, name: 'Santos', stateCode: 'SP' },
  { ibgeCode: '4205407', cptecCode: 228, name: 'Florianópolis', stateCode: 'SC' },
];

export interface WeatherDay {
  date: string;
  condition: string;
  maximumCelsius: number;
  minimumCelsius: number;
  uvIndex: number;
}

export interface WavePeriod {
  validAt: string;
  agitation: string;
  waveHeightMeters: number;
  waveDirection: string;
  windKmh: number;
  windDirection: string;
}

const parser = new XMLParser({
  allowBooleanAttributes: false,
  ignoreAttributes: true,
  parseTagValue: false,
  processEntities: false,
  trimValues: true,
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '' || /^(null|undefined)$/i.test(value.trim())) {
    throw new HttpInvalidResponseError(`CPTEC field "${field}" is invalid`);
  }
  return value.trim();
}

function finiteNumber(value: unknown, field: string): number {
  requiredString(value, field);
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new HttpInvalidResponseError(`CPTEC field "${field}" is invalid`);
  }
  return number;
}

function validDateOnly(value: unknown, field: string): string {
  const date = requiredString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpInvalidResponseError(`CPTEC field "${field}" is invalid`);
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new HttpInvalidResponseError(`CPTEC field "${field}" is invalid`);
  }
  return date;
}

function validWaveTimestamp(value: unknown): string {
  const timestamp = requiredString(value, 'dia');
  const match = /^(\d{2})-(\d{2})-(\d{4}) (\d{2})h Z$/.exec(timestamp);
  if (!match) {
    throw new HttpInvalidResponseError('CPTEC wave timestamp is invalid');
  }
  const [, day, month, year, hour] = match;
  const parsed = new Date(`${year}-${month}-${day}T${hour}:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCDate() !== Number(day) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCHours() !== Number(hour)
  ) {
    throw new HttpInvalidResponseError('CPTEC wave timestamp is invalid');
  }
  return parsed.toISOString();
}

function requireHomologatedLocation(location: CptecLocationMapping): void {
  const approved = HOMOLOGATED_LOCATIONS.find((item) => item.ibgeCode === location.ibgeCode);
  if (
    !approved ||
    approved.cptecCode !== location.cptecCode ||
    approved.stateCode !== location.stateCode ||
    approved.name !== location.name
  ) {
    throw new HttpInvalidResponseError('CPTEC location mapping is not homologated');
  }
}

function metadata(sourceUrl: string, fetchedAt: string) {
  return {
    source: SOURCE,
    sourceUrl,
    issuedAt: null,
    fetchedAt,
    coverage: COVERAGE,
    expiresAt: null,
    stale: false,
  } as const;
}

async function fetchXml(url: string): Promise<{ document: Record<string, unknown>; fetchedAt: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpTimeoutError('CPTEC request timed out');
      }
      throw new HttpInvalidResponseError('Failed to reach CPTEC');
    }

    if (!response.ok) {
      throw new HttpStatusError(`CPTEC responded with status ${response.status}`, response.status);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!/^(text|application)\/xml\b/i.test(contentType)) {
      throw new HttpInvalidResponseError('CPTEC response has an invalid Content-Type');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      throw new HttpInvalidResponseError('CPTEC response exceeds the allowed size');
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      throw new HttpInvalidResponseError('CPTEC response exceeds the allowed size');
    }

    const xml = new TextDecoder('iso-8859-1', { fatal: true }).decode(buffer);
    const declaration = /^\s*<\?xml[^>]*encoding\s*=\s*["']ISO-8859-1["'][^>]*\?>/i;
    if (!declaration.test(xml)) {
      throw new HttpInvalidResponseError('CPTEC XML encoding declaration is missing or invalid');
    }
    if (/<!(?:DOCTYPE|ENTITY)\b/i.test(xml)) {
      throw new HttpInvalidResponseError('CPTEC XML DTD and external entities are not allowed');
    }

    const validation = XMLValidator.validate(xml);
    if (validation !== true) {
      throw new HttpInvalidResponseError('CPTEC response is not valid XML');
    }

    return { document: parser.parse(xml) as Record<string, unknown>, fetchedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}

function city(document: Record<string, unknown>): Record<string, unknown> {
  const value = document.cidade;
  if (!value || typeof value !== 'object') {
    throw new HttpInvalidResponseError('CPTEC response does not contain a cidade node');
  }
  return value as Record<string, unknown>;
}

function forecastUrl(location: CptecLocationMapping, suffix: string): string {
  requireHomologatedLocation(location);
  return `${BASE_URL}/cidade/${suffix.replace('{id}', String(location.cptecCode))}`;
}

export async function fetchWeather7Days(location: CptecLocationMapping): Promise<Forecast<WeatherDay>[]> {
  const url = forecastUrl(location, '7dias/{id}/previsao.xml');
  const { document, fetchedAt } = await fetchXml(url);
  const root = city(document);
  const days = asArray(root.previsao as Record<string, unknown> | Record<string, unknown>[] | undefined);
  if (!days.length || requiredString(root.nome, 'nome') !== location.name || requiredString(root.uf, 'uf') !== location.stateCode) {
    throw new HttpInvalidResponseError('CPTEC weather response does not match the mapped location');
  }

  return days.map((day) => {
    const date = validDateOnly(day.dia, 'dia');
    const value: WeatherDay = {
      date,
      condition: requiredString(day.tempo, 'tempo'),
      maximumCelsius: finiteNumber(day.maxima, 'maxima'),
      minimumCelsius: finiteNumber(day.minima, 'minima'),
      uvIndex: finiteNumber(day.iuv, 'iuv'),
    };
    return createEstimatedForecast(value, { ...metadata(url, fetchedAt), validAt: null, validDate: date });
  });
}

function parseWave(sourceUrl: string, fetchedAt: string, period: Record<string, unknown>) {
  const validAt = validWaveTimestamp(period.dia);
  const value: WavePeriod = {
    validAt,
    agitation: requiredString(period.agitacao, 'agitacao'),
    waveHeightMeters: finiteNumber(period.altura, 'altura'),
    waveDirection: requiredString(period.direcao, 'direcao'),
    windKmh: finiteNumber(period.vento, 'vento'),
    windDirection: requiredString(period.vento_dir, 'vento_dir'),
  };
  return createEstimatedForecast(value, { ...metadata(sourceUrl, fetchedAt), validAt, validDate: null });
}

function validateWaveCity(root: Record<string, unknown>, location: CptecLocationMapping): void {
  if (requiredString(root.nome, 'nome') !== location.name || requiredString(root.uf, 'uf') !== location.stateCode) {
    throw new HttpInvalidResponseError('CPTEC wave response does not match the mapped location');
  }
}

export async function fetchDailyWaves(
  location: CptecLocationMapping,
  day: 0 | 1 | 2 = 0,
): Promise<Forecast<WavePeriod>[]> {
  if (day !== 0 && day !== 1 && day !== 2) {
    throw new HttpInvalidResponseError('CPTEC wave day must be 0, 1, or 2');
  }
  const url = forecastUrl(location, `dia/${day}/ondas.xml`);
  const { document, fetchedAt } = await fetchXml(url);
  const root = city(document);
  validateWaveCity(root, location);
  const periods = ['manha', 'tarde', 'noite'].flatMap((key) =>
    asArray(root[key] as Record<string, unknown> | Record<string, unknown>[] | undefined),
  );
  if (periods.length !== 3) {
    throw new HttpInvalidResponseError('CPTEC daily wave response has an invalid period count');
  }
  return periods.map((period) => parseWave(url, fetchedAt, period));
}

export async function fetchSixDayWaves(location: CptecLocationMapping): Promise<Forecast<WavePeriod>[]> {
  const url = forecastUrl(location, 'todos/tempos/ondas.xml');
  const { document, fetchedAt } = await fetchXml(url);
  const root = city(document);
  validateWaveCity(root, location);
  const periods = asArray(root.previsao as Record<string, unknown> | Record<string, unknown>[] | undefined);
  if (periods.length !== 48) {
    throw new HttpInvalidResponseError('CPTEC six-day wave response has an invalid period count');
  }
  return periods.map((period) => parseWave(url, fetchedAt, period));
}
