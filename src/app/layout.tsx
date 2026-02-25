import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/app/components/Providers';
import { Navigation } from '@/app/components/Navigation';

export const metadata: Metadata = {
  title: 'InnovatEPAM Portal',
  description: 'Authentication system for InnovatEPAM Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
