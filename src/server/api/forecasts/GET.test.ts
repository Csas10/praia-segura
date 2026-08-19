import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { HttpInvalidResponseError, HttpTimeoutError } from '../../http/fetch-with-timeout';
import { clearForecastCache, default as GET, forecastCacheSizeForTests } from './GET';
import { FORECAST_CACHE_POLICY } from '../../cache/forecast-cache';
import * as service from '../../services/cptec-forecast';

const forecast = {
  value: { date: '2026-08-19', condition: 'pn', maximumCelsius: 28, minimumCelsius: 19, uvIndex: 5 },
  quality: 'estimated' as const,
  source: 'CPTEC/INPE' as const,
  sourceUrl: 'https://servicos.cptec.inpe.br/XML/cidade/7dias/242/previsao.xml',
  issuedAt: null,
  issuedDate: '2026-08-18',
  validAt: null,
  validDate: '2026-08-19',
  fetchedAt: '2026-08-18T23:00:00.000Z',
  coverage: 'município (até 7 dias)',
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

function request(query: Record<string, unknown>): Request {
  return { query } as unknown as Request;
}

function response(): Response & { body?: unknown } {
  const result = {} as Response & { body?: unknown };
  result.status = vi.fn().mockReturnValue(result);
  result.set = vi.fn().mockReturnValue(result);
  result.json = vi.fn((body: unknown) => {
    result.body = body;
    return result;
  });
  return result;
}

beforeEach(() => {
  clearForecastCache();
  vi.restoreAllMocks();
});

describe('GET /api/forecasts', () => {
  it('returns a public DTO for a valid weather product', async () => {
    vi.spyOn(service, 'fetchWeatherForecastByIbge').mockResolvedValue({ ok: true, forecasts: [forecast] });
    const res = response();

    await GET(request({ ibgeId: '2927408', product: 'weather-7d' }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toMatchObject({
      ok: true,
      product: 'weather-7d',
      location: { ibgeId: '2927408', name: 'Salvador', state: 'BA' },
      forecast: [{ sourceUrl: 'https://www.cptec.inpe.br/' }],
      cache: { status: 'miss', ...FORECAST_CACHE_POLICY['weather-7d'] },
    });
    expect(JSON.stringify(res.body)).not.toContain('servicos.cptec.inpe.br');
  });

  it.each(['waves-daily', 'waves-6d'] as const)('returns a public DTO for %s', async (product) => {
    const loader = product === 'waves-daily' ? 'fetchDailyWaveForecastByIbge' : 'fetchSixDayWaveForecastByIbge';
    vi.spyOn(service, loader).mockResolvedValue({ ok: true, forecasts: [waveForecast] });
    const res = response();

    await GET(request({ ibgeId: '2927408', product }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toMatchObject({ ok: true, product, forecast: [{ quality: 'estimated' }] });
  });

  it.each([
    [{}, '400'],
    [{ ibgeId: ['2927408', '2927408'], product: 'weather-7d' }, '400'],
    [{ ibgeId: '2927408', product: 'weather-7d', extra: 'x' }, '400'],
    [{ ibgeId: '292740', product: 'weather-7d' }, '400'],
    [{ ibgeId: '2927408', product: 'invalid' }, '400'],
  ])('rejects invalid query %j', async (query, status) => {
    const res = response();
    await GET(request(query), res);
    expect(res.status).toHaveBeenCalledWith(Number(status));
  });

  it.each(['1234567', '7654321', '0000000'])('returns 404 without caching or calling CPTEC for %s', async (ibgeId) => {
    const load = vi.spyOn(service, 'fetchWeatherForecastByIbge');
    const res = response();
    await GET(request({ ibgeId, product: 'weather-7d' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toMatchObject({ ok: false, forecast: { value: null, quality: 'unavailable' } });
    expect(load).not.toHaveBeenCalled();
    expect(forecastCacheSizeForTests()).toBe(0);
  });

  it.each([
    new HttpTimeoutError('provider details'),
    new HttpInvalidResponseError('XML details'),
  ])('returns unavailable without leaking provider errors', async (error) => {
    vi.spyOn(service, 'fetchWeatherForecastByIbge').mockResolvedValue({
      ok: false,
      reason: error instanceof HttpTimeoutError ? 'timeout' : 'invalid_response',
      forecast: {
        value: null,
        quality: 'unavailable',
        source: 'CPTEC/INPE',
        sourceUrl: 'about:blank',
        issuedAt: null,
        issuedDate: null,
        validAt: null,
        validDate: null,
        fetchedAt: '2026-08-18T23:00:00.000Z',
        coverage: 'município/localidade costeira',
        expiresAt: null,
        stale: false,
      },
    });
    const res = response();

    await GET(request({ ibgeId: '2927408', product: 'weather-7d' }), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.body).toMatchObject({ ok: false, forecast: { value: null, quality: 'unavailable' } });
    expect(JSON.stringify(res.body)).not.toContain('provider details');
    expect(JSON.stringify(res.body)).not.toContain('servicos.cptec.inpe.br');
  });
});
