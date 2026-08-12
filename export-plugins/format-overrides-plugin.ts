import type { Plugin } from 'vite';

export function formatOverridesPlugin(_root?: string): Plugin {
  return {
    name: 'format-overrides-plugin',
    enforce: 'pre',
    transform(_code, _id) {
      return null;
    },
  };
}
