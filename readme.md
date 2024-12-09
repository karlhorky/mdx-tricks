# MDX Tricks

A collection of useful MDX tricks

## Interpolation in Code Blocks

In some circumstances, interpolating dynamic values in code blocks can be useful (eg. to automatically update the content of code blocks). In MDX, it may seem that JSX curly brace expressions could be used within Markdown fenced code blocks, but [MDX doesn't currently support any affordance for interpolation in Markdown fenced code blocks](https://github.com/orgs/mdx-js/discussions/2288#discussioncomment-5696483).

Eg. the following does not work:

````mdx
{/* DO NOT USE - Does not work */}

```bash
pnpm add @mdx-js/loader@{props.versions.mdxJsLoader}
```
````

![Screenshot showing curly braces appearing erroneously in final code block code](interpolation-in-code-blocks-code-fence-broken.avif)

In the screenshot above, the curly braces are rendered as-is in the final code block, rather than being interpolated with the value of `props.versions.mdxJsLoader`.

To get around this limitation, a custom `CodeBlock` component with a template string as children can be used to allow interpolation in the code block.

The following example of this approach uses:

- Next.js (App Router with React Server Components)
- [`@next/mdx`](https://www.npmjs.com/package/@next/mdx)
- [`dedent`](https://www.npmjs.com/package/dedent)
- [`hast-util-to-jsx-runtime`](https://www.npmjs.com/package/hast-util-to-jsx-runtime)
- [`shiki`](https://www.npmjs.com/package/shiki)

![Screenshot of CodeSandbox, showing an interpolated value in a syntax-highlighted code block](./interpolation-in-code-blocks-codeblock.avif)

- Code: https://github.com/karlhorky/mdx-tricks/tree/main/interpolation-in-code-blocks
- CodeSandbox Demo: https://codesandbox.io/p/sandbox/github/karlhorky/mdx-tricks/tree/main/interpolation-in-code-blocks

First, create a custom `CodeBlock` component similar to [Shiki's Next.js (React Server Components) example](https://shiki.style/packages/next#react-server-component):

`components/CodeBlock.tsx`

```tsx
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
```

Then, inject the component via `mdx-components.tsx` (Next.js) or `MDXProvider`:

`mdx-components.tsx`

```tsx
import type { MDXComponents } from 'mdx/types.js';
import CodeBlock from './components/CodeBlock.tsx';

const components = {
  CodeBlock: CodeBlock,
} satisfies MDXComponents;

export type MDXProvidedComponents = typeof components;

export function useMDXComponents(): MDXProvidedComponents {
  return components;
}
```

Finally, you can now interpolate values in your MDX code blocks:

`app/page.tsx`

```tsx
import Installation from '../content/installation.mdx';

export default async function Page() {
  const versions = await getVersions();
  return <Installation versions={versions} />;
}
```

`content/installation.mdx`

```mdx
{/* prettier-ignore *//** @typedef {import('../mdx-components.tsx').MDXProvidedComponents} MDXProvidedComponents */}

{/* prettier-ignore *//** @typedef {{ versions: { mdxJsLoader: string } }} Props */}

<CodeBlock language="bash">
  {`
    pnpm add @mdx-js/loader@${props.versions.mdxJsLoader}
  `}
</CodeBlock>
```

An added bonus of this implementation is that the `language` prop is type safe, meaning that [the MDX VS Code extension](https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx) can be configured to show you IntelliSense autosuggest and type errors:

![Screenshot of VS Code with MDX VS Code extension installed, showing autosuggest entries for the `language` prop such as `bash`, `bat`, `berry`, `blade`, etc](interpolation-in-code-blocks-language-prop-autosuggest.avif)

![Screenshot of VS Code with MDX VS Code extension installed, showing a red squiggly line under an invalid `language` prop with the value `bbbbash`, and a hover card error with the message `Type '"bbbbash"' is not assignable to type 'BundledLanguage'`](interpolation-in-code-blocks-language-prop-error.avif)

## Relative Videos without Imports

[`rehype-mdx-import-media`](https://www.npmjs.com/package/rehype-mdx-import-media) allows for Markdown syntax to reference media such as images, audio and video relative to the MDX document, eg:

`content/expo/index.mdx`

```mdx
![Expo dev server in terminal showing console.log output at bottom](expo-console-logging.avif)
```

This will result in:

```tsx
import _rehypeMdxImportMedia0 from './expo-console-logging.avif'

export default function MDXContent() {
  return (
    <p>
      <img
        alt="Expo dev server in terminal showing console.log output at bottom"
        src={_rehypeMdxImportMedia0}
      />
    </p>
  )
}
```

However, [this does not work out of the box with `<video>` elements](https://github.com/remcohaszing/rehype-mdx-import-media/issues/2), because:

1. `<video>` JSX elements are not handled by `rehype-mdx-import-media` (more specifically, [JSX built-in components are not overridden by MDX](https://github.com/remcohaszing/rehype-mdx-import-media/issues/2#issuecomment-2198361734))
2. Markdown doesn't have syntax for videos

To work around these limitations, the Markdown image syntax can be hijacked to allow `.mp4` videos.

The following example of this approach uses Next.js and `@next/mdx`.

First, add a custom remark plugin to your MDX config in your `next.config.ts` file and `file-loader` config for the `.mp4` imports in webpack:

`next.config.ts`

```ts
import withMDX from '@next/mdx';
import type { Node, Root } from 'mdast';
import type { NextConfig } from 'next';
import rehypeMdxImportMedia from 'rehype-mdx-import-media';
import { visit } from 'unist-util-visit';
import type { Configuration } from 'webpack';

const config: NextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  webpack: (webpackConfig: Configuration, { dev, isServer }) => {
    webpackConfig.module!.rules!.push(
      // .mp4 video loader for rehype-mdx-import-media
      // - https://github.com/remcohaszing/rehype-mdx-import-media/issues/3#issuecomment-2198559076
      // - https://stackoverflow.com/a/73729543/1268612
      // - https://github.com/vercel/next.js/blob/b9bd23baec14508400c502b3651f4cf2497e883b/packages/next/src/build/webpack/loaders/next-image-loader/index.ts#L23-L54
      // - https://github.com/jeremybarbet/next-videos/issues/24#issuecomment-2103003464
      //
      // TODO: Consider switching to next-file-loader or similar
      // https://github.com/idootop/next-file-loader
      {
        test: /\.mp4$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: '/_next/static/media/',
              outputPath: `${dev ? '' : '../'}${isServer ? '../' : ''}static/media/`,
              name: '[name].[hash:8].[ext]',
            },
          },
        ],
      },
    );

    return webpackConfig;
  },
};

export default withMDX({
  options: {
    remarkPlugins: [
      // Workaround for rehype-mdx-import-media not applying to
      // `<video>` tags
      // - https://github.com/karlhorky/mdx-tricks#relative-videos-without-imports
      //
      // Copied from @chailotl/remark-videos
      // - https://github.com/chailotl/remark-videos
      // - https://www.npmjs.com/package/@chailotl/remark-videos
      () => (tree: Root) => {
        visit(tree, 'image', (node) => {
          if (typeof node.url === 'string' && node.url.endsWith('.mp4')) {
            (node as Node).type = 'element';
            node.data = {
              hName: 'video',
              hProperties: {
                src: node.url,
              },
            };
          }
        });
      },
    ],
    rehypePlugins: [
      [rehypeMdxImportMedia],
    ],
  },
})(config);
```

Then, specify your videos using the Markdown image syntax (alt is ignored):

```mdx
![](expo-android-virtual-device-start-expo-go.mp4)
```

## Top-Level Table of Contents from Imported MDX Headings (Next.js)

[`@jsdevtools/rehype-toc`](https://github.com/JS-DevTools/rehype-toc) is a rehype plugin for adding a table of contents to your Markdown and MDX documents, which works well for simple use cases, eg:

The following MDX...

`index.mdx`

```mdx
# Apple Pie Recipe

## Filling

### Preparing the apples

### Preparing the spice mix

## Crust

### Preparing the dough

### The criss-cross top
```

...will result in HTML with a table of contents:

```html
<nav class="toc">
  <ol class="toc-level toc-level-1">
    <li class="toc-item toc-item-h1">
      <a class="toc-link toc-link-h1" href="#apple-pie-recipe">
        Apple Pie Recipe
      </a>

      <ol class="toc-level toc-level-2">
        <li class="toc-item toc-item-h2">
          <a class="toc-link toc-link-h2" href="#filling"> Filling </a>

          <ol class="toc-level toc-level-3">
            <li class="toc-item toc-item-h3">
              <a class="toc-link toc-link-h3" href="#preparing-the-apples">
                Preparing the apples
              </a>
            </li>
            <li class="toc-item toc-item-h3">
              <a class="toc-link toc-link-h3" href="#preparing-the-spice-mix">
                Preparing the spice mix
              </a>
            </li>
          </ol>
        </li>

        <li class="toc-item toc-item-h2">
          <a class="toc-link toc-link-h2" href="#crust"> Crust </a>

          <ol class="toc-level toc-level-3">
            <li class="toc-item toc-item-h3">
              <a class="toc-link toc-link-h3" href="#preparing-the-dough">
                Preparing the dough
              </a>
            </li>
            <li class="toc-item toc-item-h3">
              <a class="toc-link toc-link-h3" href="#the-criss-cross-top">
                The criss-cross top
              </a>
            </li>
          </ol>
        </li>
      </ol>
    </li>
  </ol>
</nav>

<h1 id="apple-pie-recipe">Apple Pie Recipe</h1>

<h2 id="filling">Filling</h2>

<h3 id="preparing-the-apples">Preparing the apples</h3>

<h3 id="preparing-the-spice-mix">Preparing the spice mix</h3>

<h2 id="crust">Crust</h2>

<h3 id="preparing-the-dough">Preparing the dough</h3>

<h3 id="the-criss-cross-top">The criss-cross top</h3>
```

One place where `@jsdevtools/rehype-toc` (and the other existing remark and rehype plugins for tables of contents) are limited is when MDX files contain imports of other MDX files, eg:

If the "Filling" section (or the whole "Apple Pie Recipe" section) is moved out into its own file...

`index.mdx`

```mdx
import Filling from './filling.mdx';

# Apple Pie Recipe

<Filling />

## Crust

### Preparing the dough

### The criss-cross top
```

`filling.mdx`

```mdx
## Filling

### Preparing the apples

### Preparing the spice mix
```

...[multiple tables of content get generated](https://github.com/orgs/mdx-js/discussions/2526) - see the "Filling" table of contents above the `<h2>`:

```html
<nav class="toc">
  <ol class="toc-level toc-level-1">
    <li class="toc-item toc-item-h1">
      <a class="toc-link toc-link-h1" href="#apple-pie-recipe">
        Apple Pie Recipe
      </a>

      <ol class="toc-level toc-level-2">
        <li class="toc-item toc-item-h2">
          <a class="toc-link toc-link-h2" href="#crust"> Crust </a>

          <ol class="toc-level toc-level-3">
            <li class="toc-item toc-item-h3">
              <a class="toc-link toc-link-h3" href="#preparing-the-dough">
                Preparing the dough
              </a>
            </li>
            <li class="toc-item toc-item-h3">
              <a class="toc-link toc-link-h3" href="#the-criss-cross-top">
                The criss-cross top
              </a>
            </li>
          </ol>
        </li>
      </ol>
    </li>
  </ol>
</nav>

<h1 id="apple-pie-recipe">Apple Pie Recipe</h1>

<nav class="toc">
  <ol class="toc-level toc-level-2">
    <li class="toc-item toc-item-h2">
      <a class="toc-link toc-link-h2" href="#filling"> Filling </a>

      <ol class="toc-level toc-level-3">
        <li class="toc-item toc-item-h3">
          <a class="toc-link toc-link-h3" href="#preparing-the-apples">
            Preparing the apples
          </a>
        </li>
        <li class="toc-item toc-item-h3">
          <a class="toc-link toc-link-h3" href="#preparing-the-spice-mix">
            Preparing the spice mix
          </a>
        </li>
      </ol>
    </li>
  </ol>
</nav>

<h2 id="filling">Filling</h2>

<h3 id="preparing-the-apples">Preparing the apples</h3>

<h3 id="preparing-the-spice-mix">Preparing the spice mix</h3>

<h2 id="crust">Crust</h2>

<h3 id="preparing-the-dough">Preparing the dough</h3>

<h3 id="the-criss-cross-top">The criss-cross top</h3>
```

To avoid multiple tables of contents on a single HTML page, a table of contents can be built dynamically using React Context.

The following example of this approach uses:

- Next.js (App Router with React Server Components)
- [`@next/mdx`](https://www.npmjs.com/package/@next/mdx)
- [`rehype-autolink-headings`](https://www.npmjs.com/package/rehype-autolink-headings)
- [`rehype-slug`](https://www.npmjs.com/package/rehype-slug)

![Screenshot of CodeSandbox, showing an expanded multi-level table of contents](./top-level-table-of-contents-from-imported-mdx-headings-next-js-codesandbox.avif)

- Code: https://github.com/karlhorky/mdx-tricks/tree/main/top-level-table-of-contents-from-imported-mdx-headings-next-js
- CodeSandbox Demo: https://codesandbox.io/p/sandbox/github/karlhorky/mdx-tricks/tree/main/top-level-table-of-contents-from-imported-mdx-headings-next-js

First, set up the components and Context:

[`app/recipes/[recipeSlug]/TableOfContents.tsx`](https://github.com/karlhorky/mdx-tricks/blob/main/top-level-table-of-contents-from-imported-mdx-headings-next-js/app/recipes/[recipeSlug]/TableOfContents.tsx)

Next, in your page (React Server Component), import your desired MDX file, wrap in the `<TableOfContentsProvider>` and pass in the table of contents components in using the `components` prop:

[`app/recipes/[recipeSlug]/page.tsx`](https://github.com/karlhorky/mdx-tricks/blob/main/top-level-table-of-contents-from-imported-mdx-headings-next-js/app/recipes/[recipeSlug]/page.tsx)

```tsx
export default async function RecipePage(props: Props) {
  // ...

  let recipeModule;

  try {
    recipeModule = (await import(
      `./content/${params.recipeSlug}/index.mdx`
    )) as RecipeMdxModule;
  } catch {
    notFound();
  }

  const MDXContent = recipeModule.default;

  return (
    <>
      <h1>{recipeModule.metadata.title}</h1>
      <TableOfContentsProvider>
        <details>
          <summary>Table of Contents</summary>
          <TableOfContents />
        </details>

        <MDXContent
          params={params}
          components={{
            h1: H1ForTableOfContents,
            h2: H2ForTableOfContents,
            h3: H3ForTableOfContents,
            h4: H4ForTableOfContents,
            h5: H5ForTableOfContents,
            h6: H6ForTableOfContents,
          }}
        />
      </TableOfContentsProvider>
    </>
  );
}
```

Finally, create the MDX files and prop drill the components so that the headings will self-register themselves in the table of contents:

`app/recipes/[recipeSlug]/content/apple-pie/index.mdx`

```mdx
import Filling from './filling.mdx';

export const metadata = {
  title: 'Apple Pie Recipe',
};

<Filling components={props.components} />

## Crust

### Preparing the dough

### The criss-cross top
```

`app/recipes/[recipeSlug]/content/apple-pie/filling.mdx`

```mdx
## Filling

### Preparing the apples

### Preparing the spice mix
```
