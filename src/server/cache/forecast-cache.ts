import type { Forecast } from '../domain/forecast';
import type { UnavailableForecast } from '../domain/forecast-result';
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
  forecasts: Extract<Forecast<T>, { quality: 'estimated' }>[] | null;
  failure: UnavailableForecast<T> | null;
  failureReason: ForecastFailureReason | null;
  freshUntilMs: number;
  staleUntilMs: number;
  nextRefreshAtMs: number;
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

    if (existing?.forecasts && nowMs <= existing.freshUntilMs) {
      return { result: withCacheMetadata(existing.forecasts, new Date(existing.freshUntilMs).toISOString(), false), status: 'hit' };
    }
    if (existing?.forecasts && nowMs < existing.staleUntilMs && nowMs < existing.nextRefreshAtMs
      && !forecastValidityEnded(existing.forecasts, nowMs)) {
      return {
        result: withCacheMetadata(existing.forecasts, new Date(existing.freshUntilMs).toISOString(), true),
        status: 'stale',
      };
    }
    if (!existing?.forecasts && existing?.failure && nowMs < existing.nextRefreshAtMs) {
      return { result: { ok: false, forecast: existing.failure, reason: existing.failureReason ?? 'invalid_response' }, status: 'hit' };
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

  sizeForTests(): number {
    return this.entries.size;
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
      const freshUntilMs = (Number.isFinite(fetchedAtMs) ? fetchedAtMs : nowMs) + freshTtlSeconds * 1000;
      this.entries.set(key, {
        forecasts: loaded.forecasts,
        failure: null,
        failureReason: null,
        freshUntilMs,
        staleUntilMs: freshUntilMs + staleIfErrorSeconds * 1000,
        nextRefreshAtMs: freshUntilMs,
      });
      return {
        result: withCacheMetadata(loaded.forecasts, new Date(freshUntilMs).toISOString(), false),
        status: 'miss',
      };
    }

    if (existing?.forecasts && nowMs < existing.staleUntilMs && !forecastValidityEnded(existing.forecasts, nowMs)) {
      existing.nextRefreshAtMs = nowMs + NEGATIVE_CACHE_SECONDS * 1000;
      existing.failure = loaded.forecast;
      existing.failureReason = loaded.reason;
      const staleResult = withCacheMetadata(existing.forecasts, new Date(existing.freshUntilMs).toISOString(), true);
      return { result: staleResult, status: 'stale' };
    }

    this.entries.set(key, {
      forecasts: null,
      failure: loaded.forecast,
      failureReason: loaded.reason,
      freshUntilMs: 0,
      staleUntilMs: 0,
      nextRefreshAtMs: nowMs + NEGATIVE_CACHE_SECONDS * 1000,
    });
    return { result: loaded, status: 'miss' };
  }
}

export type CacheFailureReason = ForecastFailureReason;
