import { useId, useRef, useState } from 'react';

export interface LocationSearchResult {
  id: string;
  name: string;
  type: 'state' | 'municipality';
  stateCode: string | null;
  stateName: string | null;
}

interface SearchSuccessResponse {
  ok: true;
  source: string;
  queriedAt: string;
  results: LocationSearchResult[];
}

interface SearchErrorResponse {
  ok: false;
  error: string;
}

type SearchState =
  | { status: 'idle' }
  | { status: 'invalid'; message: string }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; query: string }
  | { status: 'success'; query: string; results: LocationSearchResult[]; source: string };

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;

function typeLabel(type: LocationSearchResult['type']): string {
  return type === 'state' ? 'Estado' : 'Município';
}

/**
 * Search for a Brazilian city or state via the server-side IBGE Localidades
 * integration. Deliberately does not search for beaches (no approved beach
 * catalog yet) and never requests geolocation.
 */
interface LocationSearchProps {
  onSelectMunicipality?: (location: LocationSearchResult) => void;
}

export default function LocationSearch({ onSelectMunicipality }: LocationSearchProps) {
  const inputId = useId();
  const statusId = useId();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const requestIdRef = useRef(0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH || trimmed.length > MAX_QUERY_LENGTH) {
      setState({
        status: 'invalid',
        message: `Digite entre ${MIN_QUERY_LENGTH} e ${MAX_QUERY_LENGTH} caracteres para buscar.`,
      });
      return;
    }

    const requestId = ++requestIdRef.current;
    setState({ status: 'loading' });

    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(trimmed)}`);
      let body: SearchSuccessResponse | SearchErrorResponse;

      try {
        body = (await response.json()) as SearchSuccessResponse | SearchErrorResponse;
      } catch {
        body = {
          ok: false,
          error: 'O serviço de busca de localidades está indisponível no momento.',
        };
      }

      // Ignore stale responses if the user submitted a newer query meanwhile.
      if (requestIdRef.current !== requestId) {
        return;
      }

      if (!response.ok || !body.ok) {
        const message =
          'error' in body && body.error
            ? body.error
            : 'O serviço de busca de localidades está indisponível no momento.';
        setState({ status: 'error', message });
        return;
      }

      if (body.results.length === 0) {
        setState({ status: 'empty', query: trimmed });
        return;
      }

      setState({ status: 'success', query: trimmed, results: body.results, source: body.source });
    } catch {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setState({
        status: 'error',
        message: 'Não foi possível contatar o serviço de busca de localidades. Verifique sua conexão e tente novamente.',
      });
    }
  };

  return (
    <div className="location-search">
      <form className="location-search__form" onSubmit={(event) => { void handleSubmit(event); }}>
        <label htmlFor={inputId}>
          Cidade ou estado
          <input
            id={inputId}
            type="search"
            name="q"
            placeholder="Ex.: Salvador ou Bahia"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-describedby={statusId}
            autoComplete="off"
          />
        </label>
        <button type="submit" className="button button--primary">
          Buscar
        </button>
      </form>

      <p className="location-search__hint">
        Esta busca consulta apenas cidades e estados oficiais do IBGE. A busca por nome de praia
        será incorporada após a validação de um catálogo oficial.
      </p>

      <div id={statusId} aria-live="polite" className="location-search__status">
        {state.status === 'invalid' && <p role="alert">{state.message}</p>}
        {state.status === 'loading' && <p>Buscando localidades…</p>}
        {state.status === 'error' && (
          <p role="alert">
            Serviço indisponível: {state.message}
          </p>
        )}
        {state.status === 'empty' && <p>Nenhuma cidade ou estado encontrado para “{state.query}”.</p>}
        {state.status === 'success' && (
          <>
            <p className="location-search__source">
              Fonte: {state.source} · resultados para “{state.query}”
            </p>
            <ul className="location-search__results">
              {state.results.map((result) => (
                <li key={result.id} className="location-search__result">
                  {result.type === 'municipality' ? (
                    <button type="button" onClick={() => onSelectMunicipality?.(result)}>
                      <strong>{result.name}</strong>
                      <span>{typeLabel(result.type)}{result.stateCode ? ` · ${result.stateCode}` : ''}</span>
                    </button>
                  ) : (
                    <>
                      <strong>{result.name}</strong>
                      <span>{typeLabel(result.type)}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
