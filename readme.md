# MDX Tricks

A collection of useful MDX tricks

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

- GitHub repository: https://github.com/karlhorky/mdx-tricks/tree/main/top-level-table-of-contents-from-imported-mdx-headings-next-js
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
