import type { Request, Response } from 'express';
import { searchLocations } from '../../../providers/ibge/client';
import { HttpTimeoutError, HttpStatusError, HttpInvalidResponseError } from '../../../http/fetch-with-timeout';

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;

/**
 * GET /api/locations/search?q=<term>
 *
 * Searches Brazilian states and municipalities via the IBGE Localidades API.
 * This endpoint does not search beaches — there is no approved beach catalog
 * yet (see Fase 2.2+).
 */
export default async function GET(req: Request, res: Response): Promise<void> {
  const rawQuery = req.query.q;
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';

  if (!query || query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    res.status(400).json({
      ok: false,
      error: `O parâmetro "q" é obrigatório e deve ter entre ${MIN_QUERY_LENGTH} e ${MAX_QUERY_LENGTH} caracteres.`,
    });
    return;
  }

  try {
    const { results, datasetFetchedAt, cacheState } = await searchLocations(query);

    res.status(200).json({
      ok: true,
      query,
      source: 'IBGE - Localidades',
      sourceUrl: 'https://servicodados.ibge.gov.br/api/docs/localidades',
      queriedAt: new Date().toISOString(),
      datasetFetchedAt,
      cache: cacheState,
      coverage: 'Estados e municípios do Brasil cadastrados na base de Localidades do IBGE.',
      results,
    });
  } catch (error: unknown) {
    if (error instanceof HttpTimeoutError) {
      res.status(503).json({
        ok: false,
        error: 'O serviço de localidades está temporariamente indisponível (tempo de resposta excedido). Tente novamente em instantes.',
      });
      return;
    }

    if (error instanceof HttpStatusError || error instanceof HttpInvalidResponseError) {
      res.status(502).json({
        ok: false,
        error: 'Não foi possível obter dados do provedor de localidades (IBGE) neste momento.',
      });
      return;
    }

    // Never leak stack traces or internal error details to the client.
    console.error('locations search failed with an unexpected error');
    res.status(502).json({
      ok: false,
      error: 'Não foi possível obter dados do provedor de localidades neste momento.',
    });
  }
}
