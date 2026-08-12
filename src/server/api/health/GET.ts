import type { Request, Response } from 'express';

export default function GET(_req: Request, res: Response) {
  res.json({
    ok: true,
    service: 'minha-praia-segura',
    timestamp: new Date().toISOString(),
    status: 'healthy',
  });
}
