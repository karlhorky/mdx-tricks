import dedent from 'dedent';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, type JSX } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { type BundledLanguage, codeToHast } from 'shiki';

type Props = {
  children: string;
  language: BundledLanguage;
};

export default async function CodeBlock(props: Props) {
  const out = await codeToHast(dedent(props.children), {
    lang: props.language,
    theme: 'dark-plus',
  });

  // Type assertion to avoid hast-util-to-jsx-runtime bug
  // https://github.com/syntax-tree/hast-util-to-jsx-runtime/issues/10
  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
    components: {
      pre: (preProps) => <pre {...preProps} />,
      code: ({ className, ...codeProps }) => (
        <code
          {...codeProps}
          className={
            // Add class to `code` element, similar to the
            // @shiki/rehype `addLanguageClass` option:
            // https://github.com/shikijs/shiki/blob/662c54de96adb23ff1db84b60e9f5ecce786bb30/packages/rehype/test/index.test.ts#L37-L49
            `language-${props.language} ${
              className ? ` ${String(className)}` : ''
            }`
          }
        />
      ),
    },
  }) as JSX.Element;
}
