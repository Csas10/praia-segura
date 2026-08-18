import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LocationSearch from './LocationSearch';

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('LocationSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders a labeled input and a submit button', () => {
    render(<LocationSearch />);

    expect(screen.getByLabelText(/cidade ou estado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('shows a validation message for a query shorter than 2 characters', async () => {
    const user = userEvent.setup();
    render(<LocationSearch />);

    await user.type(screen.getByLabelText(/cidade ou estado/i), 'a');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/entre 2 e 80 caracteres/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveFetch: (value: Response) => void = () => {};
    vi.mocked(global.fetch).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<LocationSearch />);

    await user.type(screen.getByLabelText(/cidade ou estado/i), 'Salvador');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByText(/buscando localidades/i)).toBeInTheDocument();

    resolveFetch(
      await jsonResponse({
        ok: true,
        source: 'IBGE - Localidades',
        queriedAt: new Date().toISOString(),
        results: [],
      }),
    );
  });

  it('renders results with source attribution on success', async () => {
    vi.mocked(global.fetch).mockReturnValue(
      jsonResponse({
        ok: true,
        source: 'IBGE - Localidades',
        queriedAt: new Date().toISOString(),
        results: [
          { id: 'municipio-1', name: 'Salvador', type: 'municipality', stateCode: 'BA', stateName: 'Bahia' },
        ],
      }),
    );

    const user = userEvent.setup();
    render(<LocationSearch />);
    await user.type(screen.getByLabelText(/cidade ou estado/i), 'Salvador');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByText('Salvador')).toBeInTheDocument();
    expect(screen.getByText(/fonte: IBGE - Localidades/i)).toBeInTheDocument();
  });

  it('renders an empty-results state', async () => {
    vi.mocked(global.fetch).mockReturnValue(
      jsonResponse({ ok: true, source: 'IBGE - Localidades', queriedAt: new Date().toISOString(), results: [] }),
    );

    const user = userEvent.setup();
    render(<LocationSearch />);
    await user.type(screen.getByLabelText(/cidade ou estado/i), 'xyznaoexiste');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByText(/nenhuma cidade ou estado encontrado/i)).toBeInTheDocument();
  });

  it('renders a service-unavailable state on an error response', async () => {
    vi.mocked(global.fetch).mockReturnValue(
      jsonResponse({ ok: false, error: 'O serviço de localidades está temporariamente indisponível.' }, 503),
    );

    const user = userEvent.setup();
    render(<LocationSearch />);
    await user.type(screen.getByLabelText(/cidade ou estado/i), 'Salvador');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByText(/serviço indisponível/i)).toBeInTheDocument();
  });

  it('never calls navigator.geolocation', async () => {
    const geoSpy = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: geoSpy } });
    vi.mocked(global.fetch).mockReturnValue(
      jsonResponse({ ok: true, source: 'IBGE - Localidades', queriedAt: new Date().toISOString(), results: [] }),
    );

    const user = userEvent.setup();
    render(<LocationSearch />);
    await user.type(screen.getByLabelText(/cidade ou estado/i), 'Salvador');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(geoSpy).not.toHaveBeenCalled();
  });
});
