import { RoleGuard } from '@/app/components/RoleGuard';

/**
 * Evaluator dashboard.
 */
export default function EvaluatorDashboardPage() {
  return (
    <main>
      <h1>Evaluator dashboard</h1>
      <section>
        <h2>Evaluation stats</h2>
        <ul>
          <li>Pending reviews: 0</li>
          <li>Completed reviews: 0</li>
          <li>Average review time: 0h</li>
        </ul>
      </section>
      <section>
        <h2>Quick actions</h2>
        <RoleGuard allowedRoles={['evaluator']}>
          <button type="button">Open evaluation queue</button>
        </RoleGuard>
      </section>
    </main>
  );
}
