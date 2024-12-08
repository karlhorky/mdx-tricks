import type { MDXComponents } from 'mdx/types.js';

const components = {} satisfies MDXComponents;

export type MDXProvidedComponents = typeof components;

export function useMDXComponents(): MDXProvidedComponents {
  return components;
}
