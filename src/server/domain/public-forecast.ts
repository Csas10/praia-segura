import type { Forecast } from './forecast';
import type { WavePeriod, WeatherDay } from '../providers/cptec/client';

export type ForecastProduct = 'weather-7d' | 'waves-daily' | 'waves-6d';
export type ForecastValue = WeatherDay | WavePeriod;
export type ForecastCacheStatus = 'miss' | 'hit' | 'stale';

export interface PublicForecastResponse<T extends ForecastValue> {
  product: ForecastProduct;
  location: {
    ibgeId: string;
    name: string;
    state: string;
  };
  forecast: Forecast<T>[];
  cache: {
    status: ForecastCacheStatus;
    freshTtlSeconds: number;
    staleIfErrorSeconds: number;
  };
}

export const PUBLIC_CPTEC_SOURCE_URL = 'https://www.cptec.inpe.br/';

export function toPublicForecast<T>(forecast: Forecast<T>): Forecast<T> {
  return { ...forecast, sourceUrl: PUBLIC_CPTEC_SOURCE_URL };
}
