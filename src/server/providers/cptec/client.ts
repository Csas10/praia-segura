import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { HttpInvalidResponseError, HttpStatusError, HttpTimeoutError } from '../../http/fetch-with-timeout';
import { createEstimatedForecast } from '../../domain/forecast';
import type { Forecast } from '../../domain/forecast';

const SOURCE = 'CPTEC/INPE' as const;
const BASE_URL = 'https://servicos.cptec.inpe.br/XML';
const FETCH_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 512 * 1024;
const COVERAGE = 'município/localidade costeira';
const MIN_TEMPERATURE_CELSIUS = -80;
const MAX_TEMPERATURE_CELSIUS = 70;
const MAX_UV_INDEX = 20;
const MAX_WAVE_HEIGHT_METERS = 30;
const MAX_WIND_KMH = 300;

export type CptecInvalidResponseStage =
  | 'content_type'
  | 'charset'
  | 'encoding_declaration'
  | 'response_size'
  | 'xml_syntax'
  | 'root_missing'
  | 'location_mismatch'
  | 'update_date'
  | 'record_count'
  | 'duplicate_validity'
  | 'field_missing'
  | 'field_range'
  | 'semantic_validation';

export class CptecInvalidResponseError extends HttpInvalidResponseError {
  constructor(
    readonly stage: CptecInvalidResponseStage,
    message: string,
  ) {
    super(message);
    this.name = 'CptecInvalidResponseError';
  }
}

function invalid(stage: CptecInvalidResponseStage, message: string): never {
  throw new CptecInvalidResponseError(stage, message);
}

export class CptecCoverageUnavailableError extends Error {
  constructor() {
    super('CPTEC coverage is unavailable for the mapped location');
    this.name = 'CptecCoverageUnavailableError';
  }
}

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

type EstimatedForecast<T> = Extract<Forecast<T>, { quality: 'estimated' }>;

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
    return invalid('field_missing', `CPTEC field "${field}" is invalid`);
  }
  return value.trim();
}

function finiteNumber(value: unknown, field: string): number {
  requiredString(value, field);
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return invalid('semantic_validation', `CPTEC field "${field}" is invalid`);
  }
  return number;
}

function finiteInteger(value: unknown, field: string): number {
  const number = finiteNumber(value, field);
  if (!Number.isInteger(number)) {
    return invalid('semantic_validation', `CPTEC field "${field}" is not an integer`);
  }
  return number;
}

function bounded(value: number, field: string, minimum: number, maximum: number): number {
  if (value < minimum || value > maximum) {
    return invalid('field_range', `CPTEC field "${field}" is outside the allowed range`);
  }
  return value;
}

function validIsoDateOnly(value: unknown, field: string): string {
  const date = requiredString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return invalid('update_date', `CPTEC field "${field}" is invalid`);
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return invalid('update_date', `CPTEC field "${field}" is invalid`);
  }
  return date;
}

function validDailyWaveUpdateDate(value: unknown): string {
  const date = requiredString(value, 'atualizacao');
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
  if (!match) return invalid('update_date', 'CPTEC daily wave update date is invalid');
  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime())
    || parsed.getUTCDate() !== Number(day)
    || parsed.getUTCMonth() + 1 !== Number(month)
    || parsed.getUTCFullYear() !== Number(year)
  ) {
    return invalid('update_date', 'CPTEC daily wave update date is invalid');
  }
  return `${year}-${month}-${day}`;
}

function validWaveTimestamp(value: unknown): string {
  const timestamp = requiredString(value, 'dia');
  const match = /^(\d{2})-(\d{2})-(\d{4}) (\d{2})h Z$/.exec(timestamp);
  if (!match) {
    return invalid('semantic_validation', 'CPTEC wave timestamp is invalid');
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
    return invalid('semantic_validation', 'CPTEC wave timestamp is invalid');
  }
  return parsed.toISOString();
}

function validDirection(value: unknown, field: string): string {
  const direction = requiredString(value, field);
  const directions = new Set([
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ]);
  if (!directions.has(direction)) {
    return invalid('semantic_validation', `CPTEC field "${field}" is invalid`);
  }
  return direction;
}

function validAgitation(value: unknown): string {
  const agitation = requiredString(value, 'agitacao');
  if (!['Fraco', 'Moderado', 'Forte'].includes(agitation)) {
    return invalid('semantic_validation', 'CPTEC field "agitacao" is invalid');
  }
  return agitation;
}

function requireHomologatedLocation(location: CptecLocationMapping): void {
  const approved = HOMOLOGATED_LOCATIONS.find((item) => item.ibgeCode === location.ibgeCode);
  if (
    !approved ||
    approved.cptecCode !== location.cptecCode ||
    approved.stateCode !== location.stateCode ||
    approved.name !== location.name
  ) {
    return invalid('location_mismatch', 'CPTEC location mapping is not homologated');
  }
}

function metadata(sourceUrl: string, fetchedAt: string, issuedDate: string) {
  return {
    source: SOURCE,
    sourceUrl,
    issuedAt: null,
    issuedDate,
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
    const charset = /(?:^|;)\s*charset\s*=\s*["']?([^;"'\s]+)/i.exec(contentType)?.[1];
    if (!/^(text|application)\/xml\b/i.test(contentType)) {
      throw new CptecInvalidResponseError('content_type', 'CPTEC response has an invalid Content-Type');
    }
    if (charset?.toLowerCase() !== 'iso-8859-1') {
      throw new CptecInvalidResponseError('charset', 'CPTEC response has an invalid charset');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      throw new CptecInvalidResponseError('response_size', 'CPTEC response exceeds the allowed size');
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      throw new CptecInvalidResponseError('response_size', 'CPTEC response exceeds the allowed size');
    }

    const xml = new TextDecoder('iso-8859-1', { fatal: true }).decode(buffer);
    const declaration = /^\s*<\?xml[^>]*encoding\s*=\s*["']([^"']+)["'][^>]*\?>/i;
    const encoding = declaration.exec(xml)?.[1];
    if (encoding?.toLowerCase() !== charset.toLowerCase()) {
      throw new CptecInvalidResponseError('encoding_declaration', 'CPTEC XML encoding declaration is missing or invalid');
    }
    if (/<!(?:DOCTYPE|ENTITY)\b/i.test(xml)) {
      throw new CptecInvalidResponseError('xml_syntax', 'CPTEC XML DTD and external entities are not allowed');
    }

    const validation = XMLValidator.validate(xml);
    if (validation !== true) {
      throw new CptecInvalidResponseError('xml_syntax', 'CPTEC response is not valid XML');
    }

    return { document: parser.parse(xml) as Record<string, unknown>, fetchedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}

function city(document: Record<string, unknown>): Record<string, unknown> {
  const value = document.cidade;
  if (!value || typeof value !== 'object') {
    throw new CptecInvalidResponseError('root_missing', 'CPTEC response does not contain a cidade node');
  }
  return value as Record<string, unknown>;
}

function forecastUrl(location: CptecLocationMapping, suffix: string): string {
  requireHomologatedLocation(location);
  return `${BASE_URL}/cidade/${suffix.replace('{id}', String(location.cptecCode))}`;
}

export async function fetchWeather7Days(location: CptecLocationMapping): Promise<EstimatedForecast<WeatherDay>[]> {
  const url = forecastUrl(location, '7dias/{id}/previsao.xml');
  const { document, fetchedAt } = await fetchXml(url);
  const root = city(document);
  const days = asArray(root.previsao as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const issuedDate = validIsoDateOnly(root.atualizacao, 'atualizacao');
  if (days.length !== 7) {
    return invalid('record_count', 'CPTEC weather response has an invalid record count');
  }
  if (requiredString(root.nome, 'nome') !== location.name || requiredString(root.uf, 'uf') !== location.stateCode) {
    return invalid('location_mismatch', 'CPTEC response location does not match the mapped location');
  }

  const dates = days.map((day) => validIsoDateOnly(day.dia, 'dia'));
  if (new Set(dates).size !== dates.length) {
    return invalid('duplicate_validity', 'CPTEC weather response contains duplicate dates');
  }

  return days.map((day, index) => {
    const date = dates[index];
    const value: WeatherDay = {
      date,
      condition: requiredString(day.tempo, 'tempo'),
      maximumCelsius: bounded(
        finiteInteger(day.maxima, 'maxima'),
        'maxima',
        MIN_TEMPERATURE_CELSIUS,
        MAX_TEMPERATURE_CELSIUS,
      ),
      minimumCelsius: bounded(
        finiteInteger(day.minima, 'minima'),
        'minima',
        MIN_TEMPERATURE_CELSIUS,
        MAX_TEMPERATURE_CELSIUS,
      ),
      uvIndex: bounded(finiteNumber(day.iuv, 'iuv'), 'iuv', 0, MAX_UV_INDEX),
    };
    if (value.uvIndex < 0 || value.minimumCelsius > value.maximumCelsius) {
      throw new CptecInvalidResponseError('semantic_validation', 'CPTEC weather values are semantically invalid');
    }
    return createEstimatedForecast(value, { ...metadata(url, fetchedAt, issuedDate), validAt: null, validDate: date });
  });
}

function parseWave(sourceUrl: string, fetchedAt: string, issuedDate: string, period: Record<string, unknown>) {
  const validAt = validWaveTimestamp(period.dia);
  const value: WavePeriod = {
    validAt,
    agitation: validAgitation(period.agitacao),
    waveHeightMeters: bounded(finiteNumber(period.altura, 'altura'), 'altura', 0, MAX_WAVE_HEIGHT_METERS),
    waveDirection: validDirection(period.direcao, 'direcao'),
    windKmh: bounded(finiteNumber(period.vento, 'vento'), 'vento', 0, MAX_WIND_KMH),
    windDirection: validDirection(period.vento_dir, 'vento_dir'),
  };
  return createEstimatedForecast(value, { ...metadata(sourceUrl, fetchedAt, issuedDate), validAt, validDate: null });
}

function validateWaveCity(root: Record<string, unknown>, location: CptecLocationMapping): void {
  if (requiredString(root.nome, 'nome') !== location.name || requiredString(root.uf, 'uf') !== location.stateCode) {
    invalid('location_mismatch', 'CPTEC response location does not match the mapped location');
  }
}

export async function fetchDailyWaves(
  location: CptecLocationMapping,
  day: 0 | 1 | 2 = 0,
): Promise<EstimatedForecast<WavePeriod>[]> {
  if (day !== 0 && day !== 1 && day !== 2) {
    return invalid('semantic_validation', 'CPTEC wave day must be 0, 1, or 2');
  }
  const url = forecastUrl(location, `dia/${day}/ondas.xml`);
  const { document, fetchedAt } = await fetchXml(url);
  const root = city(document);
  validateWaveCity(root, location);
  const issuedDate = validDailyWaveUpdateDate(root.atualizacao);
  const periodsByName = ['manha', 'tarde', 'noite'].map((key) => ({
    key,
    periods: asArray(root[key] as Record<string, unknown> | Record<string, unknown>[] | undefined),
  }));
  if (periodsByName.some(({ periods }) => periods.length !== 1)) {
    return invalid('record_count', 'CPTEC daily wave response has an invalid period count');
  }
  const periods = periodsByName.map(({ periods }) => periods[0]);
  const timestamps = periods.map((period) => validWaveTimestamp(period.dia));
  if (new Set(timestamps).size !== timestamps.length) {
    return invalid('duplicate_validity', 'CPTEC daily wave response contains duplicate timestamps');
  }
  return periods.map((period) => parseWave(url, fetchedAt, issuedDate, period));
}

export async function fetchSixDayWaves(location: CptecLocationMapping): Promise<EstimatedForecast<WavePeriod>[]> {
  const url = forecastUrl(location, 'todos/tempos/ondas.xml');
  const { document, fetchedAt } = await fetchXml(url);
  const root = city(document);
  validateWaveCity(root, location);
  const issuedDate = validIsoDateOnly(root.atualizacao, 'atualizacao');
  const periods = asArray(root.previsao as Record<string, unknown> | Record<string, unknown>[] | undefined);
  if (periods.length !== 48) {
    return invalid('record_count', 'CPTEC six-day wave response has an invalid period count');
  }
  const timestamps = periods.map((period) => validWaveTimestamp(period.dia));
  if (new Set(timestamps).size !== timestamps.length) {
    return invalid('duplicate_validity', 'CPTEC six-day wave response contains duplicate timestamps');
  }
  return periods.map((period) => parseWave(url, fetchedAt, issuedDate, period));
}
