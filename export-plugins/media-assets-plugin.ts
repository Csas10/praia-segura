import type { Plugin } from 'vite';

export function mediaAssetsPlugin(): Plugin {
  return {
    name: 'media-assets-plugin',
    transform(_code, _id) {
      return null;
    },
  };
}
