'use client';

import { ReactNode } from 'react';

import { useAuthContext } from '@/app/components/AuthContext';

type UserRole = 'submitter' | 'evaluator' | 'admin';

type RoleGuardProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
};

/**
 * Conditionally renders children for allowed roles.
 *
 * @param allowedRoles Roles allowed to view the content.
 * @param children Content to render.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role } = useAuthContext();

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
