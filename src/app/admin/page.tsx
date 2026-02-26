import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { prisma } from '@/server/db/prisma';
import { authOptions } from '@/server/auth/route';

/**
 * Admin dashboard with user overview and quick actions.
 */
export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const [submitters, evaluators, admins] = await Promise.all([
    prisma.user.count({ where: { role: 'SUBMITTER' } }),
    prisma.user.count({ where: { role: 'EVALUATOR' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
  ]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-page__subtitle">
            Manage users and oversee the innovation portal.
          </p>
        </div>
        <div className="dashboard-page__actions">
          <Link href="/admin/users" className="btn btn--primary">
            User Management
          </Link>
          <Link href="/ideas" className="btn btn--secondary">
            All Ideas
          </Link>
        </div>
      </div>

      <ul className="dashboard-stats">
        <li className="dashboard-stats__card dashboard-stats__card--highlight">
          <div className="dashboard-stats__value">{submitters + evaluators + admins}</div>
          <div className="dashboard-stats__label">Total Users</div>
          <div className="dashboard-stats__trend">Portal members</div>
        </li>
        <li className="dashboard-stats__card">
          <div className="dashboard-stats__value">{submitters}</div>
          <div className="dashboard-stats__label">Submitters</div>
          <div className="dashboard-stats__trend">Idea submitters</div>
        </li>
        <li className="dashboard-stats__card">
          <div className="dashboard-stats__value">{evaluators}</div>
          <div className="dashboard-stats__label">Evaluators</div>
          <div className="dashboard-stats__trend">Reviewers</div>
        </li>
        <li className="dashboard-stats__card">
          <div className="dashboard-stats__value">{admins}</div>
          <div className="dashboard-stats__label">Admins</div>
          <div className="dashboard-stats__trend">Administrators</div>
        </li>
      </ul>

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2 className="dashboard-card__title">User Overview</h2>
          <p className="dashboard-card__subtitle">Portal Statistics</p>
          <ul className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            <li>Submitters: {submitters}</li>
            <li>Evaluators: {evaluators}</li>
            <li>Admins: {admins}</li>
          </ul>
        </section>
        <section className="dashboard-card">
          <h2 className="dashboard-card__title">Quick Actions</h2>
          <div className="dashboard-actions" style={{ flexDirection: 'column' }}>
            <Link href="/admin/users" className="btn btn--primary" style={{ justifyContent: 'center' }}>
              Open user management
            </Link>
            <Link href="/ideas" className="btn btn--secondary" style={{ justifyContent: 'center' }}>
              View all ideas
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
