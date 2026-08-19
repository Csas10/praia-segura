import { describe, expect, it, vi } from 'vitest';
import { ForecastCache, FORECAST_CACHE_POLICY } from './forecast-cache';
import type { ForecastServiceResult } from '../domain/forecast-result';
import type { WeatherDay } from '../providers/cptec/client';

function success(fetchedAt: string): ForecastServiceResult<WeatherDay> {
  return {
    ok: true,
    forecasts: [{
      value: { date: '2026-08-19', condition: 'pn', maximumCelsius: 28, minimumCelsius: 19, uvIndex: 5 },
      quality: 'estimated',
      source: 'CPTEC/INPE',
      sourceUrl: 'https://internal.example/cptec.xml',
      issuedAt: null,
      issuedDate: '2026-08-18',
      validAt: null,
      validDate: '2026-08-19',
      fetchedAt,
      coverage: 'município/localidade costeira',
      expiresAt: null,
      stale: false,
    }],
  };
}

function unavailable(fetchedAt: string): ForecastServiceResult<WeatherDay> {
  return {
    ok: false,
    reason: 'timeout',
    forecast: {
      value: null,
      quality: 'unavailable',
      source: 'CPTEC/INPE',
      sourceUrl: 'about:blank',
      issuedAt: null,
      issuedDate: null,
      validAt: null,
      validDate: null,
      fetchedAt,
      coverage: 'município/localidade costeira',
      expiresAt: null,
      stale: false,
    },
  };
}

describe('ForecastCache', () => {
  it.each(Object.entries(FORECAST_CACHE_POLICY))('uses the explicit TTL for %s', async (product, policy) => {
    let now = Date.parse('2026-08-18T00:00:00.000Z');
    const cache = new ForecastCache(() => now);
    const load = vi.fn().mockResolvedValue(success(new Date(now).toISOString()));

    await cache.get('weather:242', product as keyof typeof FORECAST_CACHE_POLICY, load);
    now += policy.freshTtlSeconds * 1000;
    const hit = await cache.get('weather:242', product as keyof typeof FORECAST_CACHE_POLICY, load);

    expect(hit.status).toBe('hit');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('shares one upstream request for concurrent misses', async () => {
    const cache = new ForecastCache(() => Date.parse('2026-08-18T00:00:00.000Z'));
    let resolve: ((result: ForecastServiceResult<WeatherDay>) => void) | undefined;
    const load = vi.fn(() => new Promise<ForecastServiceResult<WeatherDay>>((done) => { resolve = done; }));

    const first = cache.get('weather:242', 'weather-7d', load);
    const second = cache.get('weather:242', 'weather-7d', load);
    resolve?.(success('2026-08-18T00:00:00.000Z'));

    const results = await Promise.all([first, second]);
    expect(results[0]).toEqual(results[1]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('serves stale data after a refresh failure within the stale window', async () => {
    let now = Date.parse('2026-08-18T00:00:00.000Z');
    const cache = new ForecastCache(() => now);
    const load = vi.fn()
      .mockResolvedValueOnce(success(new Date(now).toISOString()))
      .mockResolvedValueOnce(unavailable(new Date(now).toISOString()));

    await cache.get('weather:242', 'weather-7d', load);
    now += (FORECAST_CACHE_POLICY['weather-7d'].freshTtlSeconds + 1) * 1000;
    const stale = await cache.get('weather:242', 'weather-7d', load);

    expect(stale.status).toBe('stale');
    expect(stale.result.ok && stale.result.forecasts[0].stale).toBe(true);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('backs off stale refreshes for 60 seconds and then recovers', async () => {
    let now = Date.parse('2026-08-18T00:00:00.000Z');
    const cache = new ForecastCache(() => now);
    const load = vi.fn()
      .mockResolvedValueOnce(success(new Date(now).toISOString()))
      .mockResolvedValueOnce(unavailable(new Date(now).toISOString()))
      .mockResolvedValueOnce(success(new Date(now).toISOString()));

    await cache.get('weather:242', 'weather-7d', load);
    now += (FORECAST_CACHE_POLICY['weather-7d'].freshTtlSeconds + 1) * 1000;
    const firstStale = await cache.get('weather:242', 'weather-7d', load);
    const secondStale = await cache.get('weather:242', 'weather-7d', load);
    expect(firstStale.status).toBe('stale');
    expect(secondStale.status).toBe('stale');
    expect(load).toHaveBeenCalledTimes(2);

    now += 60_001;
    const recovered = await cache.get('weather:242', 'weather-7d', load);
    expect(recovered.status).toBe('miss');
    expect(recovered.result.ok && recovered.result.forecasts[0].stale).toBe(false);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('single-flights the refresh after stale backoff expires', async () => {
    let now = Date.parse('2026-08-18T00:00:00.000Z');
    const cache = new ForecastCache(() => now);
    let resolve: ((result: ForecastServiceResult<WeatherDay>) => void) | undefined;
    const load = vi.fn()
      .mockResolvedValueOnce(success(new Date(now).toISOString()))
      .mockResolvedValueOnce(new Promise<ForecastServiceResult<WeatherDay>>((done) => { resolve = done; }));

    await cache.get('weather:242', 'weather-7d', load);
    now += (FORECAST_CACHE_POLICY['weather-7d'].freshTtlSeconds + 60_001) * 1000;
    const first = cache.get('weather:242', 'weather-7d', load);
    const second = cache.get('weather:242', 'weather-7d', load);
    resolve?.(unavailable(new Date(now).toISOString()));
    await Promise.all([first, second]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not serve stale data after the stale window', async () => {
    let now = Date.parse('2026-08-18T00:00:00.000Z');
    const cache = new ForecastCache(() => now);
    const load = vi.fn()
      .mockResolvedValueOnce(success(new Date(now).toISOString()))
      .mockResolvedValueOnce(unavailable(new Date(now).toISOString()));

    await cache.get('weather:242', 'weather-7d', load);
    now += (FORECAST_CACHE_POLICY['weather-7d'].freshTtlSeconds + FORECAST_CACHE_POLICY['weather-7d'].staleIfErrorSeconds + 1) * 1000;
    const result = await cache.get('weather:242', 'weather-7d', load);

    expect(result.status).toBe('miss');
    expect(result.result.ok).toBe(false);
  });

  it('caches failures for at most 60 seconds', async () => {
    let now = Date.parse('2026-08-18T00:00:00.000Z');
    const cache = new ForecastCache(() => now);
    const load = vi.fn().mockResolvedValue(unavailable(new Date(now).toISOString()));

    await cache.get('weather:242', 'weather-7d', load);
    await cache.get('weather:242', 'weather-7d', load);
    expect(load).toHaveBeenCalledTimes(1);
    now += 60_001;
    await cache.get('weather:242', 'weather-7d', load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
