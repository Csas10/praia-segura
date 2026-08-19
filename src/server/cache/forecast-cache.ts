import type { Forecast } from '../domain/forecast';
import type { ForecastFailureReason, ForecastServiceResult } from '../domain/forecast-result';
import type { ForecastProduct } from '../domain/public-forecast';

export const FORECAST_CACHE_POLICY: Record<ForecastProduct, {
  freshTtlSeconds: number;
  staleIfErrorSeconds: number;
}> = {
  'weather-7d': { freshTtlSeconds: 10_800, staleIfErrorSeconds: 21_600 },
  'waves-daily': { freshTtlSeconds: 3_600, staleIfErrorSeconds: 10_800 },
  'waves-6d': { freshTtlSeconds: 10_800, staleIfErrorSeconds: 21_600 },
};

const NEGATIVE_CACHE_SECONDS = 60;

interface CacheEntry<T> {
  result: ForecastServiceResult<T>;
  expiresAtMs: number;
  staleUntilMs: number;
}

export interface ForecastCacheResult<T> {
  result: ForecastServiceResult<T>;
  status: 'miss' | 'hit' | 'stale';
}

function forecastValidityEnded<T>(forecasts: Extract<Forecast<T>, { quality: 'estimated' }>[], nowMs: number): boolean {
  const validity = forecasts.map((forecast) => {
    if (forecast.validAt !== null) return Date.parse(forecast.validAt);
    if (forecast.validDate !== null) return Date.parse(`${forecast.validDate}T23:59:59.999Z`);
    return Number.NaN;
  });
  return validity.every((timestamp) => Number.isFinite(timestamp) && timestamp < nowMs);
}

function withCacheMetadata<T>(
  forecasts: Extract<Forecast<T>, { quality: 'estimated' }>[],
  expiresAt: string,
  stale: boolean,
): ForecastServiceResult<T> {
  return {
    ok: true,
    forecasts: forecasts.map((forecast) => ({ ...forecast, expiresAt, stale })),
  };
}

export class ForecastCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<ForecastCacheResult<unknown>>>();

  constructor(private readonly now: () => number = Date.now) {}

  async get<T>(
    key: string,
    product: ForecastProduct,
    load: () => Promise<ForecastServiceResult<T>>,
  ): Promise<ForecastCacheResult<T>> {
    const nowMs = this.now();
    const policy = FORECAST_CACHE_POLICY[product];
    const existing = this.entries.get(key) as CacheEntry<T> | undefined;

    if (existing && nowMs <= existing.expiresAtMs) {
      return { result: existing.result, status: 'hit' };
    }

    const pending = this.inFlight.get(key);
    if (pending) return pending as Promise<ForecastCacheResult<T>>;

    const request = this.refresh(key, policy.freshTtlSeconds, policy.staleIfErrorSeconds, existing, load);
    this.inFlight.set(key, request as Promise<ForecastCacheResult<unknown>>);
    try {
      return await request;
    } finally {
      this.inFlight.delete(key);
    }
  }

  clear(): void {
    this.entries.clear();
    this.inFlight.clear();
  }

  private async refresh<T>(
    key: string,
    freshTtlSeconds: number,
    staleIfErrorSeconds: number,
    existing: CacheEntry<T> | undefined,
    load: () => Promise<ForecastServiceResult<T>>,
  ): Promise<ForecastCacheResult<T>> {
    const nowMs = this.now();
    const loaded = await load();

    if (loaded.ok) {
      const fetchedAtMs = Date.parse(loaded.forecasts[0]?.fetchedAt ?? '');
      const expiresAtMs = (Number.isFinite(fetchedAtMs) ? fetchedAtMs : nowMs) + freshTtlSeconds * 1000;
      const result = withCacheMetadata(loaded.forecasts, new Date(expiresAtMs).toISOString(), false);
      this.entries.set(key, {
        result,
        expiresAtMs,
        staleUntilMs: expiresAtMs + staleIfErrorSeconds * 1000,
      });
      return { result, status: 'miss' };
    }

    if (existing?.result.ok && nowMs <= existing.staleUntilMs && !forecastValidityEnded(existing.result.forecasts, nowMs)) {
      const staleResult = withCacheMetadata(existing.result.forecasts, new Date(existing.expiresAtMs).toISOString(), true);
      return { result: staleResult, status: 'stale' };
    }

    this.entries.set(key, {
      result: loaded,
      expiresAtMs: nowMs + NEGATIVE_CACHE_SECONDS * 1000,
      staleUntilMs: nowMs + NEGATIVE_CACHE_SECONDS * 1000,
    });
    return { result: loaded, status: 'miss' };
  }
}

export type CacheFailureReason = ForecastFailureReason;
