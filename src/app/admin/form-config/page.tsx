import { FormConfigEditor } from '@/app/admin/FormConfigEditor';

/**
 * Form Configuration admin page.
 * Allows admins to add, edit, reorder, and remove dynamic form field definitions.
 */
export default function FormConfigPage() {
  return (
    <div className="dashboard-page">
      <h1>Form Configuration</h1>
      <p className="dashboard-page__subtitle mb-6">
        Configure dynamic fields for the idea submission form. Changes apply to all new submissions.
      </p>
      <section className="dashboard-section">
        <FormConfigEditor />
      </section>
    </div>
  );
}
