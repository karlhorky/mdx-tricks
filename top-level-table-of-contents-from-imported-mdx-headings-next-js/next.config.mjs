import withMDX from '@next/mdx';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

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
    rehypePlugins: [
      // Add id attributes to headings
      [rehypeSlug],

      // Add links pointing to the headings
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    ],
  },
})(nextConfig);
