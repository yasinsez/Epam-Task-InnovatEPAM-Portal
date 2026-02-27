/**
 * Loading fallback for dashboard routes while async data is fetched.
 */
export default function DashboardLoading() {
  return (
    <div className="page-container">
      <div className="dashboard-page">
        <div className="dashboard-page__header">
          <div>
            <h1>Dashboard</h1>
            <p className="dashboard-page__subtitle">
              Plan, prioritize, and accomplish your ideas with ease.
            </p>
          </div>
        </div>
        <ul className="dashboard-stats">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="dashboard-stats__card" style={{ opacity: 0.7 }}>
              <div className="dashboard-stats__value">—</div>
              <div className="dashboard-stats__label">Loading…</div>
            </li>
          ))}
        </ul>
        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h2 className="dashboard-card__title">Submission Progress</h2>
            <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading…</p>
          </section>
          <section className="dashboard-card">
            <h2 className="dashboard-card__title">Quick Actions</h2>
            <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading…</p>
          </section>
        </div>
      </div>
    </div>
  );
}
