export type ForecastQuality = 'estimated' | 'unavailable';

interface ForecastMetadata {
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

export type Forecast<T> =
  | (ForecastMetadata & { value: T; quality: 'estimated' })
  | (ForecastMetadata & { value: null; quality: 'unavailable' });

export function createEstimatedForecast<T>(
  value: T,
  metadata: ForecastMetadata,
): Extract<Forecast<T>, { quality: 'estimated' }> {
  if (metadata.validAt !== null && metadata.validDate !== null) {
    throw new Error('A forecast cannot contain both validAt and validDate');
  }
  return { ...metadata, value, quality: 'estimated' };
}

export function createUnavailableForecast<T>(
  metadata: ForecastMetadata,
): Extract<Forecast<T>, { quality: 'unavailable' }> {
  if (metadata.validAt !== null && metadata.validDate !== null) {
    throw new Error('A forecast cannot contain both validAt and validDate');
  }
  return { ...metadata, value: null, quality: 'unavailable' };
}
