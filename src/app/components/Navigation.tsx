'use client';

import Link from 'next/link';

import { useAuthContext } from '@/app/components/AuthContext';

const roleLabels: Record<'submitter' | 'evaluator' | 'admin', string> = {
  submitter: 'Submitter',
  evaluator: 'Evaluator',
  admin: 'Admin',
};

/**
 * Role-aware navigation menu.
 */
export function Navigation() {
  const { role } = useAuthContext();

  if (!role) {
    return null;
  }

  return (
    <nav aria-label="Main" className="navigation">
      <div className="navigation__title">{roleLabels[role]} Menu</div>
      <ul className="navigation__list">
        {(role === 'submitter' || role === 'admin') && (
          <li>
            <Link href="/dashboard/submitter">Submit Idea</Link>
          </li>
        )}
        {(role === 'submitter' || role === 'admin') && (
          <li>
            <Link href="/dashboard/submitter">My Ideas</Link>
          </li>
        )}
        {(role === 'evaluator' || role === 'admin') && (
          <li>
            <Link href="/dashboard/evaluator">Evaluation Queue</Link>
          </li>
        )}
        {(role === 'evaluator' || role === 'admin') && (
          <li>
            <Link href="/dashboard/evaluator">Assigned Ideas</Link>
          </li>
        )}
        {role === 'admin' && (
          <li>
            <Link href="/admin">Admin Panel</Link>
          </li>
        )}
        {role === 'admin' && (
          <li>
            <Link href="/admin">User Management</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
