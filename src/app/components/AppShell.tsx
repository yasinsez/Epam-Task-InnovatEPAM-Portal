'use client';

import { useAuthContext } from '@/app/components/AuthContext';
import { Navigation } from '@/app/components/Navigation';
import { TopHeader } from '@/app/components/TopHeader';

/**
 * App shell: Tasko-style layout with dark sidebar, top header, and main content.
 */
export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { role } = useAuthContext();

  if (!role) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Navigation />
      </aside>
      <div className="main-wrapper">
        <TopHeader />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
