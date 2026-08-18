/**
 * Geographic search result (state or municipality). This is intentionally a
 * distinct type from `Observation<T>` — it represents a reference/catalog
 * entity from IBGE, not an environmental measurement with quality/staleness
 * semantics.
 */
export type LocationType = 'state' | 'municipality';

export interface LocationResult {
  /** Stable identifier: "estado-<ibgeCode>" or "municipio-<ibgeCode>". */
  id: string;
  name: string;
  type: LocationType;
  /** IBGE code for the state or municipality itself. */
  ibgeCode: string;
  /** UF sigla (e.g. "BA"). Present for both states and municipalities. */
  stateCode: string | null;
  /** UF full name (e.g. "Bahia"). Present for both states and municipalities. */
  stateName: string | null;
  source: string;
  sourceUrl: string;
}
