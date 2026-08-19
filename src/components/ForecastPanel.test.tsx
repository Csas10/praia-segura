import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ForecastPanel from './ForecastPanel';

const location = { ibgeId: '2927408', name: 'Salvador', state: 'BA' };

function forecast(value: unknown, overrides: Record<string, unknown> = {}) {
  return {
    value,
    quality: 'estimated',
    source: 'CPTEC/INPE',
    sourceUrl: 'https://www.cptec.inpe.br/',
    issuedAt: null,
    issuedDate: '2026-08-18',
    validAt: value && typeof value === 'object' && 'validAt' in value ? value.validAt : null,
    validDate: value && typeof value === 'object' && 'date' in value ? value.date : null,
    fetchedAt: '2026-08-18T12:00:00.000Z',
    coverage: 'município (até 7 dias)',
    expiresAt: '2026-08-18T15:00:00.000Z',
    stale: false,
    ...overrides,
  };
}

function response(product: string, value: unknown, status = 200, overrides: Record<string, unknown> = {}) {
  return new Response(JSON.stringify(status === 200 ? {
    ok: true,
    product,
    location,
    forecast: [forecast(value, overrides)],
    cache: { status: 'miss', freshTtlSeconds: 60, staleIfErrorSeconds: 60 },
  } : { ok: false, error: 'failure' }), { status, headers: { 'content-type': 'application/json' } });
}

function successResponses() {
  return [
    response('weather-7d', { date: '2026-08-19', condition: 'Nublado', maximumCelsius: 28, minimumCelsius: 22, uvIndex: 4 }),
    response('waves-daily', { validAt: '2026-08-19T00:00:00.000Z', agitation: 'Fraca', waveHeightMeters: 1, waveDirection: 'Leste', windKmh: 12, windDirection: 'Nordeste' }),
    response('waves-6d', { validAt: '2026-08-19T03:00:00.000Z', agitation: 'Moderada', waveHeightMeters: 1.2, waveDirection: 'Sul', windKmh: 18, windDirection: 'Sul' }),
  ];
}

describe('ForecastPanel', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('does not query before a municipality and only enables the explicit button after selection', () => {
    render(<ForecastPanel location={null} />);
    expect(screen.getByText(/selecione um município/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('makes exactly three parallel requests only after the button click', async () => {
    vi.mocked(global.fetch).mockImplementation((input) => {
      const product = new URL(String(input), 'https://example.test').searchParams.get('product')!;
      return Promise.resolve(successResponses()[['weather-7d', 'waves-daily', 'waves-6d'].indexOf(product)]);
    });
    const user = userEvent.setup();
    render(<ForecastPanel location={location} />);
    expect(global.fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Consultar previsões' }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
    expect(screen.getByText(/Tempo — até 7 dias/)).toBeInTheDocument();
    expect(screen.getByText(/Ondas — boletim diário/)).toBeInTheDocument();
    expect(screen.getByText(/Ondas — até 6 dias/)).toBeInTheDocument();
  });

  it('renders estimated metadata, public source and UTC values', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(successResponses()[0]).mockResolvedValueOnce(successResponses()[1]).mockResolvedValueOnce(successResponses()[2]);
    const user = userEvent.setup();
    render(<ForecastPanel location={location} />);
    await user.click(screen.getByRole('button', { name: /consultar previsões/i }));
    expect((await screen.findAllByText('Previsão estimada')).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'CPTEC/INPE' })).toHaveAttribute('href', 'https://www.cptec.inpe.br/');
    expect(screen.getByText('2026-08-18')).toBeInTheDocument();
    expect(screen.getByText(/2026-08-18 12:00:00 UTC/)).toBeInTheDocument();
    expect(screen.getByText(/Atualização recomendada até/)).toBeInTheDocument();
    expect(screen.getByText('00:00 UTC')).toBeInTheDocument();
  });

  it('uses the exact unknown-condition fallback and shows permanent safety guidance', async () => {
    const replies = successResponses();
    replies[0] = response('weather-7d', { date: '2026-08-19', condition: '', maximumCelsius: 28, minimumCelsius: 22, uvIndex: 4 });
    vi.mocked(global.fetch).mockImplementationOnce(() => Promise.resolve(replies[0])).mockImplementationOnce(() => Promise.resolve(replies[1])).mockImplementationOnce(() => Promise.resolve(replies[2]));
    const user = userEvent.setup();
    render(<ForecastPanel location={location} />);
    expect(screen.getByText(/As informações são previsões estimadas e podem mudar/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /consultar previsões/i }));
    expect(await screen.findByText(/Condição não descrita pela fonte/)).toBeInTheDocument();
    expect(screen.queryByText(/tempo real|risco baixo|favorável|praia segura/i)).not.toBeInTheDocument();
  });

  it('renders stale state and the required warning', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(response('weather-7d', { date: '2026-08-19', condition: 'Nublado', maximumCelsius: 28, minimumCelsius: 22, uvIndex: 4 }, 200, { stale: true })).mockResolvedValueOnce(successResponses()[1]).mockResolvedValueOnce(successResponses()[2]);
    const user = userEvent.setup();
    render(<ForecastPanel location={location} />);
    await user.click(screen.getByRole('button', { name: /consultar previsões/i }));
    expect((await screen.findAllByText('Atualização atrasada')).length).toBeGreaterThan(0);
    expect(screen.getByText(/A fonte não pôde ser atualizada/)).toBeInTheDocument();
  });

  it('keeps successful products visible when one product is unavailable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(successResponses()[0]).mockResolvedValueOnce(response('waves-daily', null, 503)).mockResolvedValueOnce(successResponses()[2]);
    const user = userEvent.setup();
    render(<ForecastPanel location={location} />);
    await user.click(screen.getByRole('button', { name: /consultar previsões/i }));
    expect(await screen.findByText(/serviço de previsões está indisponível/i)).toBeInTheDocument();
    expect(screen.getByText(/Nublado/)).toBeInTheDocument();
    expect(screen.getByText(/Moderada/)).toBeInTheDocument();
  });

  it.each([[400, /consulta enviada não é válida/i], [404, /não está disponível/i], [429, /muitas consultas/i], [503, /indisponível/i]])('maps HTTP %s safely', async (status, message) => {
    vi.mocked(global.fetch).mockResolvedValue(response('weather-7d', null, status));
    const user = userEvent.setup();
    render(<ForecastPanel location={location} />);
    await user.click(screen.getByRole('button', { name: /consultar previsões/i }));
    expect(await screen.findAllByText(message)).not.toHaveLength(0);
  });

  it('maps network errors and retries only after a manual click', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError('network')).mockRejectedValueOnce(new TypeError('network')).mockRejectedValueOnce(new TypeError('network')).mockResolvedValue(response('weather-7d', { date: '2026-08-20', condition: 'Chuva', maximumCelsius: 27, minimumCelsius: 21, uvIndex: 3 }));
    const user = userEvent.setup();
    render(<ForecastPanel location={location} />);
    expect(global.fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /consultar previsões/i }));
    await screen.findAllByText(/não foi possível contatar/i);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    await user.click(screen.getByRole('button', { name: /consultar previsões/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(6));
  });

  it('aborts the previous request when a new municipality is selected or a new query starts', async () => {
    let resolve: (() => void) | undefined;
    vi.mocked(global.fetch).mockImplementation(() => new Promise((done) => { resolve = () => done(successResponses()[0]); }));
    const { rerender } = render(<ForecastPanel location={location} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /consultar previsões/i }));
    rerender(<ForecastPanel location={{ ibgeId: '3304557', name: 'Rio de Janeiro', state: 'RJ' }} />);
    expect(resolve).toBeDefined();
  });

  it('does not render an unapproved source URL as a link', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(response('weather-7d', { date: '2026-08-19', condition: 'Nublado', maximumCelsius: 28, minimumCelsius: 22, uvIndex: 4 }, 200, { sourceUrl: 'javascript:alert(1)' })).mockResolvedValueOnce(successResponses()[1]).mockResolvedValueOnce(successResponses()[2]);
    const user = userEvent.setup();
    render(<ForecastPanel location={location} />);
    await user.click(screen.getByRole('button', { name: /consultar previsões/i }));
    await screen.findAllByText('Previsão estimada');
    expect(screen.queryByRole('link', { name: 'CPTEC/INPE' })).not.toBeInTheDocument();
  });
});
