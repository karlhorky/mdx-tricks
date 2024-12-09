import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html>
      <head />
      <body>
        <style>{`pre { padding: 14px; border-radius: 6px }`}</style>
        <main>{children}</main>
      </body>
    </html>
  );
}
