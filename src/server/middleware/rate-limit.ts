import rateLimit from 'express-rate-limit';

/** Reusable factory for per-route rate limiters. */
export function createRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).set('Cache-Control', 'no-store').json({
        ok: false,
        error: 'Muitas buscas foram realizadas em pouco tempo. Aguarde e tente novamente.',
      });
    },
  });
}

/** Rate limit applied to GET /api/locations/search: 20 requests/minute per IP. */
export const locationsSearchLimiter = createRateLimiter(60 * 1000, 20);
