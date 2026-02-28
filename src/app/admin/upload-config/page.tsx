import { UploadConfigEditor } from '@/app/admin/UploadConfigEditor';

/**
 * Upload Configuration admin page.
 * Allows admins to configure upload limits and allowed file types.
 */
export default function UploadConfigPage() {
  return (
    <div className="dashboard-page">
      <h1>Upload Settings</h1>
      <p className="dashboard-page__subtitle mb-6">
        Configure file attachment limits for idea submissions. Changes apply to new uploads only.
      </p>
      <section className="dashboard-section">
        <UploadConfigEditor />
      </section>
    </div>
  );
}
