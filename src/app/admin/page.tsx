import { RoleGuard } from '@/app/components/RoleGuard';

/**
 * Admin dashboard.
 */
export default function AdminDashboardPage() {
  return (
    <main>
      <h1>Admin dashboard</h1>
      <section>
        <h2>User overview</h2>
        <ul>
          <li>Submitters: 0</li>
          <li>Evaluators: 0</li>
          <li>Admins: 0</li>
        </ul>
      </section>
      <section>
        <h2>Quick actions</h2>
        <RoleGuard allowedRoles={['admin']}>
          <button type="button">Open user management</button>
        </RoleGuard>
      </section>
    </main>
  );
}