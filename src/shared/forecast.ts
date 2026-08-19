export type ForecastProduct = 'weather-7d' | 'waves-daily' | 'waves-6d';
export type ForecastCacheStatus = 'miss' | 'hit' | 'stale';

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

export interface ForecastMetadata {
  source: 'CPTEC/INPE';
  sourceUrl: string;
  issuedAt: string | null;
  issuedDate: string | null;
  validAt: string | null;
  validDate: string | null;
  fetchedAt: string;
  coverage: string | null;
  expiresAt: string | null;
  stale: boolean;
  quality: 'estimated' | 'unavailable';
}

export interface PublicForecast<T> extends ForecastMetadata {
  value: T | null;
}

export interface ForecastLocation {
  ibgeId: string;
  name: string;
  state: string;
}

export interface PublicForecastResponse<T> {
  ok: true;
  product: ForecastProduct;
  location: ForecastLocation;
  forecast: PublicForecast<T>[];
  cache: {
    status: ForecastCacheStatus;
    freshTtlSeconds: number;
    staleIfErrorSeconds: number;
  };
}

export interface PublicForecastErrorResponse {
  ok: false;
  error?: string;
  forecast?: PublicForecast<WeatherDay | WavePeriod>[];
}
