import Link from 'next/link';

export default function RootLayout({ children }) {
  return (
    <html>
      <head />
      <body>
        <header>
          <nav>
            <Link href="/">Home</Link>{' '}
            <Link href="/recipes/apple-pie">Apple Pie Recipe</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
