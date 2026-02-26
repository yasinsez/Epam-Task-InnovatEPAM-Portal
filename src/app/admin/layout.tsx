import { RoleGuard } from '@/app/components/RoleGuard';
import { AdminTabs } from '@/app/admin/AdminTabs';

/**
 * Admin layout with tab navigation.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="page-container">
        <AdminTabs />
        {children}
      </div>
    </RoleGuard>
  );
}
