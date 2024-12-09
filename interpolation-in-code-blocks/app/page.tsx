import Installation from '../content/installation.mdx';

// TODO: Make database query or API call to get versions
async function getVersions() {
  return {
    mdxJsLoader: '3.1.0',
  };
}

export default async function Page() {
  const versions = await getVersions();
  return <Installation versions={versions} />;
}
