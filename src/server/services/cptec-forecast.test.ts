import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { HttpInvalidResponseError, HttpStatusError, HttpTimeoutError } from '../http/fetch-with-timeout';
import {
  fetchDailyWaveForecastByIbge,
  fetchSixDayWaveForecastByIbge,
  fetchWeatherForecastByIbge,
} from './cptec-forecast';
import * as client from '../providers/cptec/client';

const ibgeCode = '2913606';

const weatherForecast = {
  value: {
    date: '2026-08-19',
    condition: 'pn',
    maximumCelsius: 28,
    minimumCelsius: 19,
    uvIndex: 5,
  },
  quality: 'estimated' as const,
  source: 'CPTEC/INPE' as const,
  sourceUrl: 'https://servicos.cptec.inpe.br/XML/cidade/7dias/2381/previsao.xml',
  issuedAt: null,
  issuedDate: '2026-08-18',
  validAt: null,
  validDate: '2026-08-19',
  fetchedAt: '2026-08-18T23:00:00.000Z',
  coverage: 'município/localidade costeira',
  expiresAt: null,
  stale: false,
};

const waveForecast = {
  value: {
    validAt: '2026-08-18T12:00:00.000Z',
    agitation: 'Moderado',
    waveHeightMeters: 2.3,
    waveDirection: 'SE',
    windKmh: 8.7,
    windDirection: 'SE',
  },
  quality: 'estimated' as const,
  source: 'CPTEC/INPE' as const,
  sourceUrl: 'https://servicos.cptec.inpe.br/XML/cidade/dia/0/ondas.xml',
  issuedAt: null,
  issuedDate: '2026-08-18',
  validAt: '2026-08-18T12:00:00.000Z',
  validDate: null,
  fetchedAt: '2026-08-18T23:00:00.000Z',
  coverage: 'município/localidade costeira',
  expiresAt: null,
  stale: false,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('CPTEC forecast service', () => {
  it('keeps valid weather forecasts estimated', async () => {
    vi.spyOn(client, 'fetchWeather7Days').mockResolvedValue([weatherForecast]);
    const result = await fetchWeatherForecastByIbge(ibgeCode);
    expect(result).toEqual({ ok: true, forecasts: [weatherForecast] });
  });

  it('keeps valid wave forecasts estimated', async () => {
    vi.spyOn(client, 'fetchDailyWaves').mockResolvedValue([waveForecast]);
    const result = await fetchDailyWaveForecastByIbge(ibgeCode);
    expect(result).toEqual({ ok: true, forecasts: [waveForecast] });
  });

  it.each([
    ['timeout', new HttpTimeoutError('private timeout details')],
    ['upstream_http', new HttpStatusError('private upstream URL', 503)],
    ['invalid_response', new HttpInvalidResponseError('private provider payload')],
    ['coverage_unavailable', new client.CptecCoverageUnavailableError()],
  ] as const)('normalizes %s without leaking provider details', async (reason, error) => {
    vi.spyOn(client, 'fetchWeather7Days').mockRejectedValue(error);
    const result = await fetchWeatherForecastByIbge(ibgeCode);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe(reason);
    expect(result.forecast).toMatchObject({
      value: null,
      quality: 'unavailable',
      source: 'CPTEC/INPE',
      sourceUrl: 'about:blank',
      issuedAt: null,
      issuedDate: null,
      validAt: null,
      validDate: null,
      coverage: 'município/localidade costeira',
      expiresAt: null,
      stale: false,
    });
    expect(JSON.stringify(result)).not.toContain('private');
    expect(Number.isNaN(Date.parse(result.forecast.fetchedAt))).toBe(false);
  });

  it('normalizes an unmapped IBGE code without calling CPTEC', async () => {
    const request = vi.spyOn(client, 'fetchWeather7Days');
    const result = await fetchWeatherForecastByIbge('0000000');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('mapping_not_homologated');
    expect(result.forecast.value).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it('normalizes invalid six-day wave responses', async () => {
    vi.spyOn(client, 'fetchSixDayWaves').mockRejectedValue(new HttpInvalidResponseError());
    const result = await fetchSixDayWaveForecastByIbge(ibgeCode);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('invalid_response');
    expect(result.forecast.value).toBeNull();
  });

  it('does not expose CPTEC in the application entrypoint contract', async () => {
    const entrySource = await readFile('src/server/entry.ts', 'utf8');
    expect(entrySource.toLowerCase()).not.toContain('cptec');
  });
});
