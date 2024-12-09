import withMDX from '@next/mdx';

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
};

export default withMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})(nextConfig);
