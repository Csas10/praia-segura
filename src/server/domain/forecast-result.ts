import type { Forecast } from './forecast';

export type ForecastFailureReason =
  | 'timeout'
  | 'upstream_http'
  | 'invalid_response'
  | 'mapping_not_homologated'
  | 'coverage_unavailable';

export type EstimatedForecast<T> = Extract<Forecast<T>, { quality: 'estimated' }>;
export type UnavailableForecast<T> = Extract<Forecast<T>, { quality: 'unavailable' }>;

export type ForecastServiceResult<T> =
  | {
      ok: true;
      forecasts: EstimatedForecast<T>[];
    }
  | {
      ok: false;
      forecast: UnavailableForecast<T>;
      reason: ForecastFailureReason;
    };
