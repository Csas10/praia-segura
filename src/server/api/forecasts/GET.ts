import type { Request, Response } from 'express';
import { ForecastCache, FORECAST_CACHE_POLICY } from '../../cache/forecast-cache';
import { toPublicForecast } from '../../domain/public-forecast';
import type { ForecastProduct, ForecastValue } from '../../domain/public-forecast';
import {
  createUnavailableForecastResult,
  fetchDailyWaveForecastByIbge,
  fetchSixDayWaveForecastByIbge,
  fetchWeatherForecastByIbge,
} from '../../services/cptec-forecast';
import { HOMOLOGATED_LOCATIONS } from '../../providers/cptec/client';

const PRODUCTS = new Set<ForecastProduct>(['weather-7d', 'waves-daily', 'waves-6d']);
const cache = new ForecastCache();

function invalidQuery(req: Request): boolean {
  const allowed = new Set(['ibgeId', 'product']);
  const keys = Object.keys(req.query);
  return keys.length !== 2 || keys.some((key) => !allowed.has(key))
    || !keys.every((key) => typeof req.query[key] === 'string');
}

function failureStatus(reason: string): number {
  return reason === 'mapping_not_homologated' || reason === 'coverage_unavailable' ? 404 : 503;
}

export default async function GET(req: Request, res: Response): Promise<void> {
  if (invalidQuery(req)) {
    res.status(400).set('Cache-Control', 'no-store').json({ ok: false, error: 'Parâmetros inválidos.' });
    return;
  }

  const ibgeId = req.query.ibgeId as string;
  const product = req.query.product as ForecastProduct;
  if (!/^\d{7}$/.test(ibgeId) || !PRODUCTS.has(product)) {
    res.status(400).set('Cache-Control', 'no-store').json({ ok: false, error: 'Município ou produto inválido.' });
    return;
  }

  const location = HOMOLOGATED_LOCATIONS.find((item) => item.ibgeCode === ibgeId);
  if (!location) {
    const result = createUnavailableForecastResult<ForecastValue>('mapping_not_homologated');
    if (result.ok) throw new Error('Unavailable forecast factory returned an estimated result');
    res.status(404).set('Cache-Control', 'no-store').json({
      ok: false,
      forecast: toPublicForecast(result.forecast),
    });
    return;
  }
  const loader = product === 'weather-7d'
    ? () => fetchWeatherForecastByIbge(ibgeId)
    : product === 'waves-daily'
      ? () => fetchDailyWaveForecastByIbge(ibgeId)
      : () => fetchSixDayWaveForecastByIbge(ibgeId);
  const cacheKey = `${product}:${location.cptecCode}`;
  const cached = await cache.get<ForecastValue>(cacheKey, product, loader);

  if (!cached.result.ok) {
    res.status(failureStatus(cached.result.reason)).set({
      'Cache-Control': 'no-store',
      ...(cached.result.reason === 'timeout' || cached.result.reason === 'upstream_http' || cached.result.reason === 'invalid_response'
        ? { 'Retry-After': '60' }
        : {}),
    }).json({ ok: false, forecast: toPublicForecast(cached.result.forecast) });
    return;
  }

  const policy = FORECAST_CACHE_POLICY[product];
  res.status(200).set(
    'Cache-Control',
    cached.status === 'stale'
      ? 'no-store'
      : 'public, max-age=0, s-maxage=300, stale-while-revalidate=60',
  );
  if (cached.status === 'stale') res.set('Warning', '110 - "Response is stale"');
  res.json({
    ok: true,
    product,
    location: { ibgeId, name: location.name, state: location.stateCode },
    forecast: cached.result.forecasts.map(toPublicForecast),
    cache: { status: cached.status, ...policy },
  });
}

export function clearForecastCache(): void {
  cache.clear();
}

export function forecastCacheSizeForTests(): number {
  return cache.sizeForTests();
}
