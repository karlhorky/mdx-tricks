# MDX tricks

A collection of useful MDX tricks

## Generate a Table of Contents from Imported MDX Files

Build a dynamic Table of Contents (TOC) in a Next.js project using React Server Components and MDX. The TOC is automatically generated from the headings in the imported MDX files.

```tsx
'use client';

function findParent(
  items: TableOfContentsItem[],
  newItem: TableOfContentsItem,
) {
  const lastItem = items.at(-1);

  if (!lastItem) {
    throw new Error(
      'No table of contents leaf item found with previous heading level',
    );
  }

  if (lastItem.headingLevel === newItem.headingLevel - 1) {
    return lastItem.items;
  }

  return findParent(lastItem.items, newItem);
}

type TableOfContentsContext = {
  tableOfContents: {
    ids: string[];
    items: TableOfContentsItem[];
  };
  addItem: (headingLevel: number, id?: string, children?: ReactNode) => void;
};

type TableOfContentsItem = {
  headingLevel: number;
  id: string;
  children: ReactNode;
  items: TableOfContentsItem[];
};

const tableOfContentsContext = createContext<TableOfContentsContext>({
  tableOfContents: { ids: [], items: [] },
  addItem: () => {},
});

const TableOfContentsContextProvider = tableOfContentsContext.Provider;

export function useTableOfContents(
  partialItem?: Pick<TableOfContentsItem, 'headingLevel' | 'children'> & {
    id?: string;
  },
) {
  const context = useContext(tableOfContentsContext);
  const addItem = context.addItem;

  useEffect(() => {
    if (partialItem) {
      addItem(partialItem.headingLevel, partialItem.id, partialItem.children);
    }
  }, [partialItem, addItem]);

  return context;
}

type TableOfContentsProviderProps = {
  children: ReactNode;
};

export function TableOfContentsProvider(props: TableOfContentsProviderProps) {
  const [tableOfContents, setTableOfContents] = useState<
    TableOfContentsContext['tableOfContents']
  >({
    ids: [],
    items: [],
  });

  function addItem(headingLevel: number, id?: string, children?: ReactNode) {
    if (typeof id !== 'string' || !id) {
      throw new Error('id is required');
    }

    setTableOfContents((prevTableOfContents) => {
      if (headingLevel !== 2 && prevTableOfContents.items.length === 0) {
        throw new Error(`First heading with id ${id} is not h2`);
      }

      if (prevTableOfContents.ids.includes(id)) return prevTableOfContents;

      const newTableOfContents = { ...prevTableOfContents };

      const newItem = {
        headingLevel,
        id,
        children,
        items: [],
      };

      newTableOfContents.ids.push(newItem.id);

      const parent =
        newItem.headingLevel === 2
          ? newTableOfContents.items
          : findParent(newTableOfContents.items, newItem);

      parent.push(newItem);

      return newTableOfContents;
    });
  }

  return (
    <TableOfContentsContextProvider value={{ tableOfContents, addItem }}>
      {props.children}
    </TableOfContentsContextProvider>
  );
}

type OlProps = {
  items: TableOfContentsItem[];
};

function Ol(props: OlProps) {
  return (
    <ol>
      {props.items.map((item) => (
        <li key={`item-${item.id}`}>
          {item.children}
          {item.items.length > 0 && <Ol items={item.items} />}
        </li>
      ))}
    </ol>
  );
}

export function TableOfContents() {
  const { tableOfContents } = useTableOfContents();

  return (
    <nav>
      <Ol items={tableOfContents.items} />
    </nav>
  );
}

export function H1ForTableOfContents({
  id,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  useTableOfContents({ headingLevel: 1, id, children });
  return (
    <h1 id={id} {...props}>
      {children}
    </h1>
  );
}

export function H2ForTableOfContents({
  id,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  useTableOfContents({ headingLevel: 2, id, children });
  return (
    <h2 id={id} {...props}>
      {children}
    </h2>
  );
}

export function H3ForTableOfContents({
  id,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  useTableOfContents({ headingLevel: 3, id, children });
  return (
    <h3 id={id} {...props}>
      {children}
    </h3>
  );
}

export function H4ForTableOfContents({
  id,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  useTableOfContents({ headingLevel: 4, id, children });
  return (
    <h4 id={id} {...props}>
      {children}
    </h4>
  );
}

export function H5ForTableOfContents({
  id,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  useTableOfContents({ headingLevel: 5, id, children });
  return (
    <h5 id={id} {...props}>
      {children}
    </h5>
  );
}

export function H6ForTableOfContents({
  id,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  useTableOfContents({ headingLevel: 6, id, children });
  return (
    <h6 id={id} {...props}>
      {children}
    </h6>
  );
}
```

After creating the file above, you can use the `TableOfContentsProvider` and `TableOfContents` in your Server Component.

```tsx
export default async function CurriculumModule(props: Props) {
  let curriculumModule;

  try {
    curriculumModule = await getCurriculumModule(
      getMdxDir(props.curriculumSlug, props.curriculumModuleSlug),
    );
  } catch {
    notFound();
  }

  const MDXContent = curriculumModule.default;

  return (
    <TableOfContentsProvider>
      <details className="mt-[-0.6rem]">
        <summary>Table of Contents</summary>
        <TableOfContents />
      </details>

      <MDXContent
        params={props.params}
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
  );
}
```
