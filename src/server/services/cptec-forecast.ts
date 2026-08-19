import { createUnavailableForecast } from '../domain/forecast';
import type { EstimatedForecast, ForecastServiceResult } from '../domain/forecast-result';
import {
  CptecCoverageUnavailableError,
  fetchDailyWaves,
  fetchSixDayWaves,
  fetchWeather7Days,
  HOMOLOGATED_LOCATIONS,
} from '../providers/cptec/client';
import type { WavePeriod, WeatherDay } from '../providers/cptec/client';
import { HttpInvalidResponseError, HttpStatusError, HttpTimeoutError } from '../http/fetch-with-timeout';

const SAFE_SOURCE_URL = 'about:blank';
const COVERAGE = 'município/localidade costeira';

function unavailable<T>(reason: Exclude<ForecastServiceResult<T>, { ok: true }>['reason']): ForecastServiceResult<T> {
  const forecast = createUnavailableForecast<T>({
    source: 'CPTEC/INPE',
    sourceUrl: SAFE_SOURCE_URL,
    issuedAt: null,
    validAt: null,
    validDate: null,
    fetchedAt: new Date().toISOString(),
    coverage: COVERAGE,
    expiresAt: null,
    stale: false,
  });
  return { ok: false, forecast, reason };
}

function resolveLocation(ibgeCode: string) {
  return HOMOLOGATED_LOCATIONS.find((location) => location.ibgeCode === ibgeCode);
}

function failureReason(error: unknown): Exclude<ForecastServiceResult<never>, { ok: true }>['reason'] {
  if (error instanceof HttpTimeoutError) return 'timeout';
  if (error instanceof HttpStatusError) return 'upstream_http';
  if (error instanceof CptecCoverageUnavailableError) return 'coverage_unavailable';
  if (error instanceof HttpInvalidResponseError) return 'invalid_response';
  return 'invalid_response';
}

async function run<T>(
  ibgeCode: string,
  load: (location: (typeof HOMOLOGATED_LOCATIONS)[number]) => Promise<EstimatedForecast<T>[]>,
): Promise<ForecastServiceResult<T>> {
  const location = resolveLocation(ibgeCode);
  if (!location) return unavailable('mapping_not_homologated');

  try {
    return { ok: true, forecasts: await load(location) };
  } catch (error) {
    return unavailable(failureReason(error));
  }
}

export function fetchWeatherForecastByIbge(ibgeCode: string): Promise<ForecastServiceResult<WeatherDay>> {
  return run(ibgeCode, fetchWeather7Days);
}

export function fetchDailyWaveForecastByIbge(ibgeCode: string): Promise<ForecastServiceResult<WavePeriod>> {
  return run(ibgeCode, fetchDailyWaves);
}

export function fetchSixDayWaveForecastByIbge(ibgeCode: string): Promise<ForecastServiceResult<WavePeriod>> {
  return run(ibgeCode, fetchSixDayWaves);
}
