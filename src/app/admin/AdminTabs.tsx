'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function AdminTabLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        isActive
          ? 'border-[#003da5] text-[#003da5] bg-white'
          : 'border-transparent text-[#64748b] hover:text-[#003da5] hover:border-[#e2e8f0]'
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * Admin tab navigation. Highlights the active tab based on current path.
 */
export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-1 border-b border-[#e2e8f0]">
      <AdminTabLink href="/admin" isActive={pathname === '/admin'}>
        Admin Panel
      </AdminTabLink>
      <AdminTabLink href="/admin/users" isActive={pathname === '/admin/users'}>
        User Management
      </AdminTabLink>
      <AdminTabLink href="/admin/form-config" isActive={pathname === '/admin/form-config'}>
        Form Configuration
      </AdminTabLink>
      <AdminTabLink href="/admin/upload-config" isActive={pathname === '/admin/upload-config'}>
        Upload Settings
      </AdminTabLink>
      <AdminTabLink href="/admin/stages" isActive={pathname === '/admin/stages'}>
        Review Stages
      </AdminTabLink>
    </div>
  );
}
