import type { MDXComponents } from 'mdx/types';
import type { JSX } from 'react';
import {
  H1ForTableOfContents,
  H2ForTableOfContents,
  H3ForTableOfContents,
  H4ForTableOfContents,
  H5ForTableOfContents,
  H6ForTableOfContents,
  TableOfContents,
  TableOfContentsProvider,
} from './TableOfContents.tsx';
import { notFound } from 'next/navigation';

type RecipeMdxModule = {
  default: (props: {
    readonly components?: MDXComponents | undefined;
    params: {
      recipeSlug: string;
    };
  }) => JSX.Element;
  metadata: {
    title: string;
  };
};

type Props = {
  params: Promise<{
    recipeSlug: string;
  }>;
};

export default async function RecipePage(props: Props) {
  const params = await props.params;

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
