import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { getSubmissionStats } from '@/lib/services/idea-service';
import { resolveUserIdForDb } from '@/lib/auth/roles';
import { RoleGuard } from '@/app/components/RoleGuard';
import { authOptions } from '@/server/auth/route';

/**
 * Submitter dashboard. Displays real submission stats from the database.
 */
export default async function SubmitterDashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId) {
    redirect('/auth/login');
  }

  const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
  const stats = await getSubmissionStats(resolvedUserId);

  return (
    <main className="page-container">
      <div className="dashboard-page">
        <div className="dashboard-page__header">
          <div>
            <h1>Dashboard</h1>
            <p className="dashboard-page__subtitle">
              Plan, prioritize, and accomplish your ideas with ease.
            </p>
          </div>
          <div className="dashboard-page__actions">
            <RoleGuard allowedRoles={['submitter']}>
              <Link href="/ideas/submit" className="btn btn--primary">
                Submit Idea
              </Link>
            </RoleGuard>
            <Link href="/ideas" className="btn btn--secondary">
              My Ideas
            </Link>
          </div>
        </div>

        <ul className="dashboard-stats">
          <li className="dashboard-stats__card dashboard-stats__card--highlight">
            <div className="dashboard-stats__value">{stats.total}</div>
            <div className="dashboard-stats__label">Total Ideas</div>
            <div className="dashboard-stats__trend">
              {stats.pendingReview > 0 ? `${stats.pendingReview} in review` : 'All caught up'}
            </div>
          </li>
          <li className="dashboard-stats__card">
            <Link href="/ideas/drafts" className="dashboard-stats__link">
              <div className="dashboard-stats__value">{stats.drafts}</div>
              <div className="dashboard-stats__label">Drafts</div>
              <div className="dashboard-stats__trend">Saved ideas</div>
            </Link>
          </li>
          <li className="dashboard-stats__card">
            <div className="dashboard-stats__value">{stats.approved}</div>
            <div className="dashboard-stats__label">Approved</div>
            <div className="dashboard-stats__trend">Accepted</div>
          </li>
          <li className="dashboard-stats__card">
            <div className="dashboard-stats__value">{stats.rejected}</div>
            <div className="dashboard-stats__label">Rejected</div>
            <div className="dashboard-stats__trend">Reviewed</div>
          </li>
        </ul>

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h2 className="dashboard-card__title">Submission Progress</h2>
            <p className="dashboard-card__subtitle">Your Activity</p>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `conic-gradient(var(--tasko-green) ${(stats.total > 0 ? (stats.approved / stats.total) * 100 : 0)}%, #e2e8f0 0%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                    Approval rate
                  </p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                    {stats.approved} of {stats.total} approved
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="dashboard-card">
            <h2 className="dashboard-card__title">Quick Actions</h2>
            <div className="dashboard-actions" style={{ flexDirection: 'column' }}>
              <RoleGuard allowedRoles={['submitter']}>
                <Link href="/ideas/submit" className="btn btn--primary" style={{ justifyContent: 'center' }}>
                  Submit new idea
                </Link>
              </RoleGuard>
              <Link href="/ideas" className="btn btn--secondary" style={{ justifyContent: 'center' }}>
                View My Ideas
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
