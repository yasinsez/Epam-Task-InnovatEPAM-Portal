'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

import { useAuthContext } from '@/app/components/AuthContext';

function NavLink({
  href,
  children,
  badge,
  icon,
}: Readonly<{
  href: string;
  children: React.ReactNode;
  badge?: number;
  icon: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isActive = (() => {
    if (pathname === href) return true;
    // /dashboard redirects admins to /admin, so show Dashboard active when on /admin
    if (href === '/dashboard' && pathname === '/admin') return true;
    if (!pathname.startsWith(href + '/')) return false;
    // Parent /dashboard should not be active when on /dashboard/evaluator (has its own nav item)
    if (href === '/dashboard' && pathname.startsWith('/dashboard/evaluator')) return false;
    // Parent /ideas should not be active when on /ideas/submit (has its own nav item)
    if (href === '/ideas' && pathname.startsWith('/ideas/submit')) return false;
    // Parent /admin should not be active when on /admin/users (has its own nav item)
    if (href === '/admin' && pathname.startsWith('/admin/users')) return false;
    return true;
  })();
  return (
    <li>
      <Link
        href={href}
        className={`sidebar-nav__link ${isActive ? 'sidebar-nav__link--active' : ''}`}
      >
        <span className="sidebar-nav__icon">{icon}</span>
        <span className="sidebar-nav__label">{children}</span>
        {badge != null && badge > 0 && (
          <span className="sidebar-nav__badge">{badge}</span>
        )}
      </Link>
    </li>
  );
}

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  tasks: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  team: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  help: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

/**
 * Role-aware navigation menu in Tasko style (MENU + GENERAL sections).
 */
const IDEAS_LABEL: Record<string, string> = {
  admin: 'All Ideas',
  submitter: 'My Ideas',
  evaluator: 'Evaluation Queue',
};

export function Navigation() {
  const { role } = useAuthContext();

  if (!role) {
    return null;
  }

  const ideasLabel = IDEAS_LABEL[role] ?? 'Ideas';

  return (
    <nav aria-label="Main" className="sidebar-nav">
      <div className="sidebar__logo">
        <Link href="/dashboard" className="sidebar__logo-link">
          <span className="sidebar__logo-icon" aria-hidden>◆</span>
          InnovatEPAM
        </Link>
      </div>

      <div className="sidebar-nav__section">
        <div className="sidebar-nav__title">MENU</div>
        <ul className="sidebar-nav__list">
          <NavLink href="/dashboard" icon={icons.dashboard}>Dashboard</NavLink>
          {(role === 'submitter' || role === 'admin') && (
            <NavLink href="/ideas/submit" icon={icons.tasks}>Submit Idea</NavLink>
          )}
          <NavLink href="/ideas" icon={icons.tasks}>{ideasLabel}</NavLink>
          {(role === 'evaluator' || role === 'admin') && (
            <NavLink href="/dashboard/evaluator" icon={icons.analytics}>Assigned Ideas</NavLink>
          )}
          {role === 'admin' && (
            <NavLink href="/admin/users" icon={icons.team}>User Management</NavLink>
          )}
        </ul>
      </div>

      <div className="sidebar-nav__section sidebar-nav__general">
        <div className="sidebar-nav__title">GENERAL</div>
        <ul className="sidebar-nav__list">
          <li>
            <span className="sidebar-nav__link sidebar-nav__link--disabled">
              <span className="sidebar-nav__icon">{icons.settings}</span>
              <span className="sidebar-nav__label">Settings</span>
            </span>
          </li>
          <li>
            <span className="sidebar-nav__link sidebar-nav__link--disabled">
              <span className="sidebar-nav__icon">{icons.help}</span>
              <span className="sidebar-nav__label">Help</span>
            </span>
          </li>
          <li>
            <button
              type="button"
              onClick={async () => {
                await signOut({ redirect: false, callbackUrl: '/auth' });
                globalThis.location.href = '/auth';
              }}
              className="sidebar-nav__link sidebar-nav__logout-btn"
            >
              <span className="sidebar-nav__icon">{icons.logout}</span>
              <span className="sidebar-nav__label">Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
