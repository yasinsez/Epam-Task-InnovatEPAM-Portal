'use client';

import { Component, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { Category } from '@prisma/client';
import { IdeaAttachmentInput, type UploadConfigDisplay } from '@/components/IdeaAttachmentInput';
import { DynamicFieldRenderer } from '@/components/DynamicFieldRenderer';
import type { FormConfigDto } from '@/lib/services/form-config-service';
import { UPLOAD_CONFIG_DEFAULTS } from '@/lib/constants/attachment';

interface SubmitIdeaFormProps {
  categories: Category[];
  formConfig?: FormConfigDto | null;
  uploadConfig?: UploadConfigDisplay | null;
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
}

interface FormErrors {
  title?: string[];
  description?: string[];
  categoryId?: string[];
  attachment?: string[];
  [key: `dynamicFieldValues.${string}`]: string[] | undefined;
}

interface SubmitIdeaFormState {
  formData: FormData;
  dynamicFieldValues: Record<string, string | number | boolean | string[]>;
  files: File[];
  errors: FormErrors;
  isSubmitting: boolean;
  submitError?: string;
  submitSuccess: boolean;
  submittedIdeaId?: string;
  retryCount: number;
}

/**
 * SubmitIdeaForm component
 *
 * A controlled form component for users to submit innovation ideas.
 * Includes:
 * - Form fields for title, description, and category selection
 * - Client-side and server-side validation feedback
 * - Submission handling with error and success messages
 * - Loading state during submission
 * - Retry logic for transient server errors (3 retries, 1s cooldown)
 * - Accessibility features (ARIA labels, focus management)
 *
 * @param categories - Array of available categories for the dropdown
 *
 * @example
 * <SubmitIdeaForm categories={categories} />
 */
export class SubmitIdeaForm extends Component<SubmitIdeaFormProps, SubmitIdeaFormState> {
  constructor(props: SubmitIdeaFormProps) {
    super(props);
    this.state = {
      formData: {
        title: '',
        description: '',
        categoryId: '',
      },
      dynamicFieldValues: {},
      files: [],
      errors: {},
      isSubmitting: false,
      submitSuccess: false,
      retryCount: 0,
    };
  }

  /**
   * Handles change events for form fields.
   * Updates formData state and clears any existing error for that field.
   */
  handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = event.target;
    this.setState(
      (prevState) => ({
        formData: {
          ...prevState.formData,
          [name]: value,
        },
      }),
      () => {
        // Clear error for this field as user starts typing
        if (this.state.errors[name as keyof FormErrors]) {
          this.setState((prevState) => ({
            errors: {
              ...prevState.errors,
              [name]: undefined,
            },
          }));
        }
      },
    );
  };

  /**
   * Handles form submission with retry logic.
   * Sends idea data to /api/ideas and handles success/error responses.
   * Automatically retries up to 3 times on server errors (500).
   */
  handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    this.setState({ isSubmitting: true, submitError: undefined, retryCount: 0 });

    this.submitWithRetry();
  };

  /**
   * Attempts to submit form data with retry logic.
   * Uses FormData when attachment is present; JSON otherwise.
   * Retries up to 3 times on server errors with 1-second cooldown.
   */
  private submitWithRetry = async (): Promise<void> => {
    try {
      const { formData, dynamicFieldValues, files } = this.state;

      // Build payload - omit empty optional dynamic values
      const cleanedDynamic: Record<string, string | number | boolean | string[]> = {};
      Object.entries(dynamicFieldValues).forEach(([k, v]) => {
        if (v === undefined || v === '') return;
        if (Array.isArray(v) && v.length === 0) return;
        cleanedDynamic[k] = v;
      });

      let response: Response;
      if (files.length > 0) {
        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('description', formData.description);
        fd.append('categoryId', formData.categoryId);
        fd.append('dynamicFieldValues', JSON.stringify(cleanedDynamic));
        for (const file of files) {
          fd.append('attachments', file);
        }
        response = await fetch('/api/ideas', { method: 'POST', body: fd });
      } else {
        response = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            dynamicFieldValues: Object.keys(cleanedDynamic).length > 0 ? cleanedDynamic : undefined,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 500) {
          // Server error - retry logic
          this.setState((prevState) => {
            const newRetryCount = prevState.retryCount + 1;
            if (newRetryCount < 3) {
              // Schedule retry after 1 second
              setTimeout(() => {
                this.submitWithRetry();
              }, 1000);
              return {
                formData: prevState.formData,
                errors: prevState.errors,
                isSubmitting: true,
                submitError: prevState.submitError,
                submitSuccess: false,
                retryCount: newRetryCount,
              };
            } else {
              // Max retries exceeded
              return {
                formData: prevState.formData,
                errors: prevState.errors,
                submitError: 'Failed after 3 attempts. Please contact support.',
                isSubmitting: false,
                submitSuccess: false,
                retryCount: newRetryCount,
              };
            }
          });
        } else if (data.details) {
          // Validation errors from API (fixed + dynamic fields)
          this.setState({
            errors: data.details as FormErrors,
            isSubmitting: false,
          });
        } else {
          // General error (may be attachment-related)
          const err = data.error || 'Failed to submit idea. Please try again.';
          const isAttachmentError = /file|attachment|type|size|count/i.test(err);
          this.setState({
            errors: isAttachmentError ? { attachment: [err] } : {},
            submitError: isAttachmentError ? undefined : err,
            isSubmitting: false,
          });
        }
        return;
      }

      // Success
      this.setState({
        submitSuccess: true,
        formData: { title: '', description: '', categoryId: '' },
        dynamicFieldValues: {},
        files: [],
        errors: {},
        isSubmitting: false,
        retryCount: 0,
        submittedIdeaId: data.idea?.id,
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        this.setState({ submitSuccess: false, submittedIdeaId: undefined });
      }, 3000);
    } catch (error) {
      this.setState({
        submitError: error instanceof Error ? error.message : 'Network error occurred',
        isSubmitting: false,
      });
    }
  };

  render(): JSX.Element {
    const { formData, dynamicFieldValues, files, errors, isSubmitting, submitError, submitSuccess, submittedIdeaId } =
      this.state;
    const { categories, uploadConfig: uploadConfigProp } = this.props;

    const uploadConfig: UploadConfigDisplay =
      uploadConfigProp ?? {
        maxFileCount: UPLOAD_CONFIG_DEFAULTS.maxFileCount,
        maxFileSizeBytes: UPLOAD_CONFIG_DEFAULTS.maxFileSizeBytes,
        maxTotalSizeBytes: UPLOAD_CONFIG_DEFAULTS.maxTotalSizeBytes,
        allowedExtensions: [...UPLOAD_CONFIG_DEFAULTS.allowedExtensions],
        allowedTypesLabel: UPLOAD_CONFIG_DEFAULTS.allowedExtensions
          .map((e) => e.replace(/^\./, '').toUpperCase())
          .join(', '),
      };

    return (
      <form onSubmit={this.handleSubmit} className="submit-idea-form">
        {submitError && (
          <div className="error-message alert" role="alert" aria-live="assertive">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="success-message alert" role="alert" aria-live="polite">
            Your idea has been submitted successfully!
            {submittedIdeaId && (
              <span>
                {' '}
                <Link href={`/ideas/${submittedIdeaId}`}>View your idea</Link>
              </span>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title">
            Title{' '}
            <span className="required" aria-label="required">
              *
            </span>
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={this.handleChange}
            disabled={isSubmitting}
            aria-required="true"
            aria-describedby={errors.title ? 'title-error' : undefined}
            aria-busy={isSubmitting}
            placeholder="Enter your idea title (5-100 characters)"
          />
          {errors.title && (
            <div id="title-error" className="field-error">
              {errors.title.join(', ')}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description{' '}
            <span className="required" aria-label="required">
              *
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={this.handleChange}
            disabled={isSubmitting}
            aria-required="true"
            aria-describedby={errors.description ? 'description-error' : undefined}
            aria-busy={isSubmitting}
            placeholder="Describe your idea in detail (20-2000 characters)"
            rows={6}
          />
          {errors.description && (
            <div id="description-error" className="field-error">
              {errors.description.join(', ')}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="categoryId">
            Category{' '}
            <span className="required" aria-label="required">
              *
            </span>
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={this.handleChange}
            disabled={isSubmitting}
            aria-required="true"
            aria-describedby={errors.categoryId ? 'categoryId-error' : undefined}
            aria-busy={isSubmitting}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <div id="categoryId-error" className="field-error">
              {errors.categoryId.join(', ')}
            </div>
          )}
        </div>

        {this.props.formConfig?.fields?.map((field) => (
          <DynamicFieldRenderer
            key={field.id}
            field={field}
            value={dynamicFieldValues[field.id]}
            onChange={(fieldId, value) =>
              this.setState((prev) => ({
                dynamicFieldValues: { ...prev.dynamicFieldValues, [fieldId]: value },
              }))
            }
            disabled={isSubmitting}
            error={errors[`dynamicFieldValues.${field.id}`]}
          />
        ))}

        <IdeaAttachmentInput
          value={files}
          onChange={(newFiles) => this.setState({ files: newFiles })}
          config={uploadConfig}
          error={errors.attachment?.join(', ')}
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className={isSubmitting ? 'loading' : ''}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Idea'}
        </button>
      </form>
    );
  }
}
