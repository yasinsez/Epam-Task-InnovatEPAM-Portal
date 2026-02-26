'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

/**
 * Tasko-style top header: logo, search bar, user profile.
 */
export function TopHeader() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'User';
  const userEmail = session?.user?.email ?? '';

  return (
    <header className="top-header">
      <Link href="/dashboard" className="top-header__brand">
        <span className="top-header__brand-icon" aria-hidden>
          ◆
        </span>
        InnovatEPAM
      </Link>
      <div className="top-header__search">
        <span className="top-header__search-icon" aria-hidden>⌕</span>
        <input
          type="search"
          placeholder="Search ideas"
          className="top-header__search-input"
          aria-label="Search ideas"
        />
        <span className="top-header__search-shortcut">xF</span>
      </div>
      <div className="top-header__right">
        <button type="button" className="top-header__icon-btn" aria-label="Messages">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </button>
        <button type="button" className="top-header__icon-btn" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <div className="top-header__profile">
          <div className="top-header__avatar" aria-hidden>
            {(userName.charAt(0) ?? '?').toUpperCase()}
          </div>
          <div className="top-header__user-info">
            <span className="top-header__user-name">{userName}</span>
            <span className="top-header__user-email">{userEmail || '—'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
