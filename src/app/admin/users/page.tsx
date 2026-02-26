import { UserManagementTable } from '@/app/admin/UserManagementTable';

/**
 * User Management tab. Lists users with ability to change roles.
 */
export default function UserManagementPage() {
  return (
    <div className="dashboard-page">
      <h1>User Management</h1>
      <section className="dashboard-section">
        <UserManagementTable />
      </section>
    </div>
  );
}
