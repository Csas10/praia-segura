/**
 * Shared contract reserved for future environmental/marine observations
 * (tide, wind, weather, sea conditions — Fase 2.2+).
 *
 * Not used for geographic search results (states/municipalities); those use
 * `LocationResult` from `./location.ts`. This type exists so later phases
 * share one consistent quality/source model instead of inventing ad-hoc
 * shapes per provider.
 */
export type DataQuality = 'real' | 'estimated' | 'unavailable' | 'demonstration';

export interface Observation<T> {
  value: T | null;
  quality: DataQuality;
  source: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
  fetchedAt: string;
  coverage: string | null;
  expiresAt: string | null;
  stale: boolean;
}
