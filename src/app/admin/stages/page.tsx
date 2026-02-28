import { StageConfigForm } from '@/components/StageConfigForm';

/**
 * Admin Review Stages configuration page.
 * Allows admins to create, edit, reorder, and remove review stages.
 */
export default function AdminStagesPage() {
  return (
    <div className="dashboard-page">
      <h1>Review Stages</h1>
      <p className="dashboard-page__subtitle mb-6">
        Configure the multi-stage review pipeline. Ideas progress through stages in order. When no
        stages exist, the default single-stage evaluation flow is used.
      </p>
      <section className="dashboard-section">
        <StageConfigForm />
      </section>
    </div>
  );
}
