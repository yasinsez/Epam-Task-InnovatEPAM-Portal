import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { getEvaluatorStats } from '@/lib/services/idea-service';
import { RoleGuard } from '@/app/components/RoleGuard';
import { authOptions } from '@/server/auth/route';

/**
 * Evaluator dashboard.
 */
export default async function EvaluatorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const stats = await getEvaluatorStats();

  return (
    <main className="page-container">
      <div className="dashboard-page">
        <div className="dashboard-page__header">
          <div>
            <h1>Dashboard</h1>
            <p className="dashboard-page__subtitle">
              Review and evaluate submitted ideas efficiently.
            </p>
          </div>
          <div className="dashboard-page__actions">
            <RoleGuard allowedRoles={['evaluator', 'admin']}>
              <Link href="/ideas" className="btn btn--primary">
                Evaluation Queue
              </Link>
            </RoleGuard>
            <Link href="/dashboard/evaluator" className="btn btn--secondary">
              Assigned Ideas
            </Link>
          </div>
        </div>

        <ul className="dashboard-stats">
          <li className="dashboard-stats__card dashboard-stats__card--highlight">
            <div className="dashboard-stats__value">{stats.pendingReviews}</div>
            <div className="dashboard-stats__label">Pending Reviews</div>
            <div className="dashboard-stats__trend">
              Awaiting evaluation
            </div>
          </li>
          <li className="dashboard-stats__card">
            <div className="dashboard-stats__value">{stats.completedReviews}</div>
            <div className="dashboard-stats__label">Completed</div>
            <div className="dashboard-stats__trend">Reviews done</div>
          </li>
          <li className="dashboard-stats__card">
            <div className="dashboard-stats__value">{stats.averageReviewTimeHours}h</div>
            <div className="dashboard-stats__label">Avg. Review Time</div>
            <div className="dashboard-stats__trend">Hours per idea</div>
          </li>
        </ul>

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h2 className="dashboard-card__title">Evaluation Stats</h2>
            <p className="dashboard-card__subtitle">Weekly Activity</p>
            <ul className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              <li>Pending: {stats.pendingReviews}</li>
              <li>Completed: {stats.completedReviews}</li>
              <li>Avg. time: {stats.averageReviewTimeHours}h</li>
            </ul>
          </section>
          <section className="dashboard-card">
            <h2 className="dashboard-card__title">Quick Actions</h2>
            <RoleGuard allowedRoles={['evaluator', 'admin']}>
              <Link href="/ideas" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                Open queue ({stats.pendingReviews})
              </Link>
            </RoleGuard>
          </section>
        </div>
      </div>
    </main>
  );
}
