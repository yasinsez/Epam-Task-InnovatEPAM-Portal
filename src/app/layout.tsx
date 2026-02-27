import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import './globals.css';
import { Providers } from '@/app/components/Providers';
import { AppShell } from '@/app/components/AppShell';
import { authOptions } from '@/server/auth/route';

export const metadata: Metadata = {
  title: 'InnovatEPAM Portal',
  description: 'Innovation portal for EPAM',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <Providers session={session}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
