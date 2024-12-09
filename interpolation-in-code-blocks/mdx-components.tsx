import type { MDXComponents } from 'mdx/types.js';
import CodeBlock from './components/CodeBlock.tsx';

const components = {
  CodeBlock: CodeBlock,
} satisfies MDXComponents;

export type MDXProvidedComponents = typeof components;

export function useMDXComponents(): MDXProvidedComponents {
  return components;
}
