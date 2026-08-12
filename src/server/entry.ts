import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import healthRoute from './api/health/GET';
import agentsRouter from './agents/router';

const app = express();
const clientDir = path.resolve(process.cwd(), 'dist', 'client');
const indexHtmlPath = path.join(clientDir, 'index.html');

app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? '1'));
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req: Request, res: Response) => {
  healthRoute(req, res);
});

// Agents API
app.use('/api/agents', agentsRouter);

if (existsSync(clientDir)) {
  app.use(express.static(clientDir, { index: false }));

  app.get(/^\/(?!api).*/, (req: Request, res: Response) => {
    const validPaths = ['/', '/privacy', '/terms'];
    const normalizedPath = req.path === '/' ? '/' : req.path.replace(/\/+$/, '');

    if (!validPaths.includes(normalizedPath)) {
      return res.status(404).send('Not Found');
    }

    if (!existsSync(indexHtmlPath)) {
      return res.status(404).send('Not Found');
    }

    res.type('html').send(readFileSync(indexHtmlPath, 'utf8'));
  });
}

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: 'Not found',
  });
});

export const server = app;

export default function appHandler(req: Request, res: Response, next: NextFunction) {
  return app(req, res, next);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || '3000');

  app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
  });
}
