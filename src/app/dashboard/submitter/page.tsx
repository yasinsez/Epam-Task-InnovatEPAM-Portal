import { RoleGuard } from '@/app/components/RoleGuard';

/**
 * Submitter dashboard.
 */
export default function SubmitterDashboardPage() {
  return (
    <main>
      <h1>Submitter dashboard</h1>
      <section>
        <h2>Submission stats</h2>
        <ul>
          <li>Ideas submitted: 0</li>
          <li>Drafts: 0</li>
          <li>Pending review: 0</li>
          <li>Approved: 0</li>
          <li>Rejected: 0</li>
        </ul>
      </section>
      <section>
        <h2>Quick actions</h2>
        <RoleGuard allowedRoles={['submitter']}>
          <button type="button">Submit new idea</button>
        </RoleGuard>
      </section>
    </main>
  );
}
