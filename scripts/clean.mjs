import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = ['dist', 'coverage', '.vite', 'node_modules/.vite'];

for (const target of targets) {
  rmSync(resolve(process.cwd(), target), {
    recursive: true,
    force: true,
  });
}
