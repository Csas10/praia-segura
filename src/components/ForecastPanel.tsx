import { useEffect, useRef, useState } from 'react';
import type {
  ForecastLocation,
  ForecastProduct,
  PublicForecastErrorResponse,
  PublicForecastResponse,
  WavePeriod,
  WeatherDay,
} from '@/shared/forecast';
import ForecastMetadata from './ForecastMetadata';
import ForecastStatusBadge from './ForecastStatusBadge';
import WaveForecastTable from './WaveForecastTable';
import WeatherForecastList from './WeatherForecastList';

type ProductResult =
  | { product: 'weather-7d'; response: PublicForecastResponse<WeatherDay> }
  | { product: 'waves-daily'; response: PublicForecastResponse<WavePeriod> }
  | { product: 'waves-6d'; response: PublicForecastResponse<WavePeriod> };
type ProductState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; result: ProductResult }
  | { status: 'error'; message: string };
type ProductStates = Record<ForecastProduct, ProductState>;
const products: ForecastProduct[] = ['weather-7d', 'waves-daily', 'waves-6d'];

function initialStates(): ProductStates {
  return { 'weather-7d': { status: 'idle' }, 'waves-daily': { status: 'idle' }, 'waves-6d': { status: 'idle' } };
}

function errorMessage(status: number | null): string {
  if (status === 400) return 'A consulta enviada não é válida. Selecione o município novamente.';
  if (status === 404) return 'A previsão não está disponível para este município.';
  if (status === 429) return 'Muitas consultas foram feitas em pouco tempo. Aguarde e tente novamente.';
  if (status === 503) return 'O serviço de previsões está indisponível no momento.';
  return 'Não foi possível contatar o serviço de previsões. Verifique a conexão e tente novamente.';
}

async function loadProduct(product: ForecastProduct, ibgeId: string, signal: AbortSignal): Promise<ProductResult> {
  let response: Response;
  try {
    response = await fetch(`/api/forecasts?ibgeId=${encodeURIComponent(ibgeId)}&product=${product}`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error(errorMessage(null));
  }
  let body: PublicForecastResponse<WeatherDay | WavePeriod> | PublicForecastErrorResponse | null = null;
  try {
    body = await response.json() as PublicForecastResponse<WeatherDay | WavePeriod> | PublicForecastErrorResponse;
  } catch {
    // A status-only response still receives a useful local message.
  }
  if (!response.ok || !body || !body.ok) throw new Error(errorMessage(response.status));
  return { product, response: body } as ProductResult;
}

function ProductError({ message }: { message: string }) {
  return <p className="forecast-product__error" role="alert"><ForecastStatusBadge stale={false} unavailable /> {message}</p>;
}

export default function ForecastPanel({ location }: { location: ForecastLocation | null }) {
  const controllerRef = useRef<AbortController | null>(null);
  const [states, setStates] = useState<ProductStates>(initialStates);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    controllerRef.current?.abort();
    setStates(initialStates());
    setLoading(false);
    setMessage('');
  }, [location?.ibgeId]);

  const requestForecasts = async () => {
    if (!location) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setMessage('Consultando previsões para os três produtos.');
    setStates({ 'weather-7d': { status: 'loading' }, 'waves-daily': { status: 'loading' }, 'waves-6d': { status: 'loading' } });
    const settled = await Promise.allSettled(products.map((product) => loadProduct(product, location.ibgeId, controller.signal)));
    if (controller.signal.aborted) return;
    const next = initialStates();
    settled.forEach((result, index) => {
      const product = products[index];
      next[product] = result.status === 'fulfilled'
        ? { status: 'success', result: result.value }
        : { status: 'error', message: result.reason instanceof Error ? result.reason.message : errorMessage(null) };
    });
    setStates(next);
    setLoading(false);
    setMessage('Consulta concluída.');
  };

  const stateFor = (product: ForecastProduct) => states[product];
  const success = (product: ForecastProduct): ProductResult | null => {
    const state = stateFor(product);
    return state.status === 'success' ? state.result : null;
  };
  const stale = products.some((product) => {
    const state = stateFor(product);
    return state.status === 'success' && (state.result.response.cache.status === 'stale' || state.result.response.forecast.some((item) => item.stale));
  });
  const metadata = products.map(stateFor).find((state): state is Extract<ProductState, { status: 'success' }> => state.status === 'success')?.result.response.forecast[0];

  if (!location) {
    return <section className="forecast-panel" aria-labelledby="forecast-heading"><h2 id="forecast-heading">Previsões</h2><p>Selecione um município para habilitar a consulta de previsões.</p></section>;
  }

  const renderProduct = (product: ForecastProduct, heading: string) => {
    const state = stateFor(product);
    const result = success(product);
    const content = result?.product === 'weather-7d'
      ? <WeatherForecastList forecast={result.response.forecast} />
      : result?.product === 'waves-daily' || result?.product === 'waves-6d'
        ? <WaveForecastTable product={result.product} forecast={result.response.forecast} />
        : null;
    return (
      <section aria-labelledby={`${product}-heading`}>
        <h3 id={`${product}-heading`}>{heading}</h3>
        {content}
        {state.status === 'error' && <ProductError message={state.message} />}
        {state.status === 'loading' && <p>Consultando este produto…</p>}
        {state.status === 'idle' && <p>Aguardando consulta manual.</p>}
      </section>
    );
  };

  return (
    <section className="forecast-panel" aria-labelledby="forecast-heading">
      <div className="forecast-panel__heading"><div><p className="eyebrow">Consulta manual</p><h2 id="forecast-heading">Previsões para {location.name} — {location.state}</h2></div><ForecastStatusBadge stale={stale} unavailable={false} /></div>
      <p className="forecast-notice">As informações são previsões estimadas e podem mudar. Consulte salva-vidas, sinalização e autoridades locais antes de entrar no mar.</p>
      {stale && <p className="forecast-stale-warning" role="alert">A fonte não pôde ser atualizada. Exibimos a última previsão válida disponível.</p>}
      <div className="forecast-panel__status" aria-live="polite"><p>{message}</p></div>
      <button type="button" className="button button--ghost" onClick={() => { void requestForecasts(); }} disabled={loading}>{loading ? 'Consultando…' : 'Consultar previsões'}</button>
      {metadata && <ForecastMetadata metadata={metadata} />}
      <div className="forecast-products">
        {renderProduct('weather-7d', 'Tempo — até 7 dias')}
        {renderProduct('waves-daily', 'Ondas — boletim diário')}
        {renderProduct('waves-6d', 'Ondas — até 6 dias')}
      </div>
    </section>
  );
}
