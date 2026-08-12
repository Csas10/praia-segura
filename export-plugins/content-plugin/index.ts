import type { Plugin } from 'vite';

export function contentPlugin(): Plugin {
  return {
    name: 'content-plugin',
    transform(_code, _id) {
      return null;
    },
  };
}
