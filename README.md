# MDX tricks

A collection of useful MDX tricks

## Generate a Table of Contents from Imported MDX Files

Build a dynamic Table of Contents (TOC) in a Next.js project using React Server Components and MDX. The TOC is automatically generated from the headings in the imported MDX files.

### 1. Setting up the TOC Context

Create a context to store the TOC data.

```tsx
function createTOCContext() {
  return createContext({
    toc: [],
    setToc: function (toc) {},
  });
}

const TableOfContentsContext = createTOCContext();

function useTableOfContents() {
  const context = useContext(TableOfContentsContext);
  if (!context) {
    throw new Error(
      'useTableOfContents must be used within a TableOfContentsProvider',
    );
  }
  return context;
}
```

### 2. Providing the TOC Context

Wrap the content with a provider component that supplies the TOC context to all child components.

```tsx
function TableOfContentsProvider({ children }) {
  const [toc, setToc] = useState([]);

  return (
    <TableOfContentsContext.Provider value={{ toc, setToc }}>
      {children}
    </TableOfContentsContext.Provider>
  );
}
```

### 3. Inserting Headings into the TOC

The helper function that inserts the headings into the correct hierarchy level.

```tsx
function insertIntoToc(toc, newItem) {
  function insert(items, itemToInsert) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].level < itemToInsert.level) {
        if (!items[i].children) items[i].children = [];
        insert(items[i].children, itemToInsert);
        return;
      } else if (items[i].level === itemToInsert.level) {
        items.splice(i + 1, 0, itemToInsert);
        return;
      } else if (items[i].level > itemToInsert.level) {
        if (!items[i].children) items[i].children = [];
        insert(items[i].children, itemToInsert);
        return;
      }
    }
    toc.push(itemToInsert);
  }

  insert(toc, newItem);
  return toc;
}
```

### 4. Custom Header Component

To display the TOC, we create custom components for each heading level.

```tsx
function Heading({ level, children, ...rest }) {
  const { toc, setToc } = useTableOfContents();
  const id = rest.id || children.toString().toLowerCase().replace(/\s+/g, '-');

  useEffect(function () {
    setToc(function (prevToc) {
      return insertIntoToc([...prevToc], {
        level: level,
        text: children,
        id: id,
        children: [],
      });
    });
  }, []);

  const Tag = `h${level}`;
  return (
    <Tag id={id} {...rest}>
      {children}
    </Tag>
  );
}

function H2(props) {
  return Heading({ level: 2, ...props });
}

function H3(props) {
  return Heading({ level: 3, ...props });
}

const mdxComponents = {
  h2: H2,
  h3: H3,
};
```

### 5. Render the TOC

We create a component to render the TOC.

```tsx
function RenderTocItems(items) {
  return (
    <ol>
      {items.map(function (item) {
        return (
          <li key={item.id}>
            {item.text}
            {item.children.length > 0 && RenderTocItems(item.children)}
          </li>
        );
      })}
    </ol>
  );
}

function TableOfContents() {
  const { toc } = useTableOfContents();
  return <nav aria-label="Table of contents">{RenderTocItems(toc)}</nav>;
}
```

### 6. Main Component Implementation

Wrap the content with the TOC provider and render the TOC.

```tsx
export default async function CurriculumModule(props) {
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
      <details>
        <summary>Table of Contents</summary>
        <TableOfContents />
      </details>

      <MDXContent components={mdxComponents} params={props.params} />
    </TableOfContentsProvider>
  );
}
```
