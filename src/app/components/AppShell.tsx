'use client';

import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/app/components/AuthContext';
import { Navigation } from '@/app/components/Navigation';
import { TopHeader } from '@/app/components/TopHeader';

/** Routes that use the full app shell (sidebar + header). */
const SHELL_ROUTES = ['/dashboard', '/admin', '/ideas', '/access-denied'];

function useShowShell() {
  const pathname = usePathname() ?? '';
  const { role } = useAuthContext();
  if (role) return true;
  return SHELL_ROUTES.some((r) => pathname.startsWith(r));
}

/**
 * App shell: Tasko-style layout with dark sidebar, top header, and main content.
 * Renders full layout on protected routes even during session load to prevent blank content.
 */
export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const showShell = useShowShell();

  if (!showShell) {
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
