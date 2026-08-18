export type ForecastQuality = 'estimated' | 'unavailable';

export interface Forecast<T> {
  value: T | null;
  quality: ForecastQuality;
  source: 'CPTEC/INPE';
  sourceUrl: string;
  issuedAt: string | null;
  validAt: string | null;
  validDate: string | null;
  fetchedAt: string;
  coverage: string | null;
  expiresAt: string | null;
  stale: boolean;
}

export function createEstimatedForecast<T>(
  value: T,
  metadata: Omit<Forecast<T>, 'value' | 'quality'>,
): Forecast<T> {
  if (metadata.validAt !== null && metadata.validDate !== null) {
    throw new Error('A forecast cannot contain both validAt and validDate');
  }
  return { ...metadata, value, quality: 'estimated' };
}

export function createUnavailableForecast<T>(
  metadata: Omit<Forecast<T>, 'value' | 'quality'>,
): Forecast<T> {
  if (metadata.validAt !== null && metadata.validDate !== null) {
    throw new Error('A forecast cannot contain both validAt and validDate');
  }
  return { ...metadata, value: null, quality: 'unavailable' };
}
