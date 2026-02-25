# Quickstart: Idea Submission Form Implementation

**Feature**: 004-idea-submission-form  
**Audience**: Developers implementing the idea submission form  
**Time to Complete**: ~4 hours for initial implementation + testing

---

## 1. Database Setup

### 1.1 Create Prisma Migration

```bash
cd /Users/yasinsezgin/GitRepositories/Epam-Task-InnovatEPAM-Portal
npx prisma migrate dev --name add_idea_category_models
```

This will:
1. Create `Category` table with seed data (4 predefined categories)
2. Create `Idea` table with foreign keys
3. Add relations to `User` model
4. Create indexed columns for efficient queries

### 1.2 Understand the Schema

**Category Model**:
- `id`: Unique identifier (CUID)
- `name`: Category name (e.g., "Process Improvement")
- `slug`: URL-safe version
- `order`: Sort order for form dropdown
- `isActive`: Whether available for new submissions

**Idea Model**:
- `id`: Unique identifier
- `title`: User-entered title (5-100 chars, sanitized)
- `description`: User-entered description (20-2000 chars, sanitized)
- `categoryId`: Reference to Category
- `userId`: Reference to User who submitted
- `submittedAt`: Submission timestamp
- `status`: Currently "SUBMITTED"; reserved for future enhancements

See [data-model.md](data-model.md) for full schema details.

---

## 2. Create Validation & Sanitization Utilities

### 2.1 Create `src/lib/validators.ts`

This file contains form validation logic using Zod:

```typescript
import { z } from 'zod';

/**
 * Schema for idea submission form validation.
 * Validates title (5-100 chars), description (20-2000 chars), and categoryId.
 * @example
 *   const data = { title: '...', description: '...', categoryId: '...' };
 *   const validated = SubmitIdeaSchema.parse(data); // throws on error
 */
export const SubmitIdeaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  categoryId: z
    .string()
    .min(1, 'Please select a category'),
});

export type SubmitIdeaInput = z.infer<typeof SubmitIdeaSchema>;
```

### 2.2 Create `src/lib/sanitizers.ts`

This file sanitizes user input for storage:

```typescript
/**
 * Sanitizes text by removing HTML and special characters.
 * Preserves: alphanumeric, spaces, hyphens, periods, commas.
 * @param text - Raw input text
 * @returns Sanitized text
 * @example
 *   sanitizeText('<script>alert("xss")</script>') 
 *   // → 'scriptalertxssscript'
 *   sanitizeText('Hello, world!') 
 *   // → 'Hello, world'
 */
export function sanitizeText(text: string): string {
  return text.replace(/[^a-zA-Z0-9\s\-.,]/g, '');
}
```

### 2.3 Update `src/lib/utils/errors.ts` (if needed)

Ensure custom error classes exist:

```typescript
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
```

---

## 3. Create API Route

### 3.1 Create `src/app/api/ideas/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { SubmitIdeaSchema } from '@/lib/validators';
import { sanitizeText } from '@/lib/sanitizers';
import { ValidationError, NotFoundError } from '@/lib/utils/errors';
import { prisma } from '@/server/db/prisma';

/**
 * POST /api/ideas
 * Creates a new idea submission from an authenticated user.
 * 
 * @param request - HTTP request with JSON body containing title, description, categoryId
 * @returns 201 with created idea, or 400/401/500 with error details
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validated = SubmitIdeaSchema.parse(body);

    // 3. Verify category exists and is active
    const category = await prisma.category.findUnique({
      where: { id: validated.categoryId },
    });

    if (!category || !category.isActive) {
      return NextResponse.json(
        { success: false, error: 'Selected category is no longer available' },
        { status: 400 }
      );
    }

    // 4. Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 400 }
      );
    }

    // 5. Sanitize input
    const sanitizedTitle = sanitizeText(validated.title);
    const sanitizedDescription = sanitizeText(validated.description);

    // 6. Create idea in database
    const idea = await prisma.idea.create({
      data: {
        title: validated.title,
        description: validated.description,
        sanitizedTitle,
        sanitizedDescription,
        categoryId: validated.categoryId,
        userId: user.id,
        status: 'SUBMITTED',
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    // 7. Log submission
    console.log(`[Idea Submission] User=${user.id}, Category=${category.name}, ID=${idea.id}`);

    // 8. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Your idea has been submitted successfully',
        idea: {
          id: idea.id,
          title: idea.title,
          description: idea.description,
          categoryId: idea.categoryId,
          category: idea.category,
          userId: idea.userId,
          submittedAt: idea.submittedAt,
          createdAt: idea.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Validation error
      const details: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(err.message);
      });

      return NextResponse.json(
        { success: false, error: 'Validation failed', details },
        { status: 400 }
      );
    }

    console.error('[Idea Submission Error]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit your idea. Please try again' },
      { status: 500 }
    );
  }
}
```

---

## 4. Create React Form Component

### 4.1 Create `src/components/SubmitIdeaForm.tsx`

A controlled form component with error handling and retry logic:

```typescript
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';

interface FormState {
  title: string;
  description: string;
  categoryId: string;
}

interface FormErrors {
  [key: string]: string;
}

/**
 * Form component for submitting an innovation idea.
 * Handles validation, submission, error display, and retry logic.
 * 
 * @example
 *   <SubmitIdeaForm categories={categories} />
 */
export function SubmitIdeaForm({
  categories,
}: {
  categories: Array<{ id: string; name: string }>;
}) {
  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    categoryId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitIdea();
  };

  const submitIdea = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);
    setErrors({});

    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        setSubmitMessage('Your idea has been submitted successfully!');
        setFormData({ title: '', description: '', categoryId: '' });
        setRetryCount(0);
      } else if (response.status === 400) {
        // Validation or category error
        if (data.details) {
          setErrors(data.details);
        } else {
          setSubmitError(data.error || 'Failed to submit your idea. Please try again');
        }
      } else if (response.status >= 500) {
        // Server error - allow retries
        setRetryCount((prev) => prev + 1);
        if (retryCount < 3) {
          setSubmitError(`Failed to submit. Retrying (${retryCount + 1}/3)...`);
          // Wait 1 second before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await submitIdea();
        } else {
          setSubmitError('Failed to submit your idea. Please contact support');
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="idea-submission-form">
      <h2>Submit Your Idea</h2>

      {/* Success Message */}
      {submitMessage && (
        <div className="alert alert-success" role="alert">
          {submitMessage}
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="alert alert-error" role="alert">
          {submitError}
        </div>
      )}

      {/* Title Field */}
      <div className="form-group">
        <label htmlFor="title">
          Title <span className="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          disabled={isSubmitting}
          required
          aria-required="true"
          aria-describedby={errors.title ? 'title-error' : undefined}
          placeholder="Enter a concise idea title (5-100 characters)"
        />
        {errors.title && (
          <div id="title-error" className="error-message">
            {errors.title}
          </div>
        )}
      </div>

      {/* Description Field */}
      <div className="form-group">
        <label htmlFor="description">
          Description <span className="required">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={isSubmitting}
          required
          aria-required="true"
          aria-describedby={errors.description ? 'description-error' : undefined}
          placeholder="Describe your idea in detail (20-2000 characters)"
          rows={6}
        />
        {errors.description && (
          <div id="description-error" className="error-message">
            {errors.description}
          </div>
        )}
      </div>

      {/* Category Field */}
      <div className="form-group">
        <label htmlFor="categoryId">
          Category <span className="required">*</span>
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          disabled={isSubmitting}
          required
          aria-required="true"
          aria-describedby={errors.categoryId ? 'category-error' : undefined}
        >
          <option value="">-- Select a category --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <div id="category-error" className="error-message">
            {errors.categoryId}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="submit-button"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Idea'}
      </button>

      {/* Loading Spinner (optional) */}
      {isSubmitting && <div className="spinner" aria-label="Loading"></div>}
    </form>
  );
}
```

---

## 5. Create Page Component

### 5.1 Create `src/app/ideas/submit/page.tsx`

This page wraps the form and fetches categories:

```typescript
import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

import { SubmitIdeaForm } from '@/components/SubmitIdeaForm';
import { prisma } from '@/server/db/prisma';

export const metadata: Metadata = {
  title: 'Submit an Idea | InnovatEPAM Portal',
  description: 'Share your innovation idea with the InnovatEPAM Portal community.',
};

/**
 * Idea submission page. Requires authentication.
 * Fetches active categories and displays the submission form.
 */
export default async function SubmitIdeaPage() {
  // 1. Check authentication
  const session = await getServerSession();
  if (!session) {
    redirect('/auth/login?callbackUrl=/ideas/submit');
  }

  // 2. Fetch active categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <main className="submit-idea-container">
      <SubmitIdeaForm categories={categories} />
    </main>
  );
}
```

---

## 6. Testing Setup

### 6.1 Unit Tests for Validators

Create `tests/unit/lib/validators.test.ts`:

```typescript
import { SubmitIdeaSchema } from '@/lib/validators';

describe('SubmitIdeaSchema', () => {
  it('should validate a correct submission', () => {
    const data = {
      title: 'Valid Title Here',
      description: 'This is a valid description of an idea.',
      categoryId: 'cat_001',
    };
    expect(() => SubmitIdeaSchema.parse(data)).not.toThrow();
  });

  it('should reject title with less than 5 characters', () => {
    const data = {
      title: 'Hi',
      description: 'This is a valid description.',
      categoryId: 'cat_001',
    };
    expect(() => SubmitIdeaSchema.parse(data)).toThrow();
  });

  it('should reject title with more than 100 characters', () => {
    const data = {
      title: 'a'.repeat(101),
      description: 'This is a valid description.',
      categoryId: 'cat_001',
    };
    expect(() => SubmitIdeaSchema.parse(data)).toThrow();
  });

  it('should reject empty categoryId', () => {
    const data = {
      title: 'Valid Title',
      description: 'This is a valid description.',
      categoryId: '',
    };
    expect(() => SubmitIdeaSchema.parse(data)).toThrow();
  });
});
```

### 6.2 Integration Tests for API Route

Create `tests/integration/api/ideas/route.test.ts` to test the POST endpoint with mocked Prisma.

### 6.3 E2E Tests

Create `tests/e2e/idea-submission.spec.ts` to test the complete user workflow with Playwright.

---

## 7. Add Routes to Navigation (if applicable)

If implementing navigation links, add:

```typescript
// In your navigation component:
{
  href: '/ideas/submit',
  label: 'Submit Idea',
  requiredRole: 'SUBMITTER',
}
```

---

## 8. Run and Verify

```bash
# 1. Start development server
npm run dev

# 2. Run tests
npm run test:unit
npm run test:integration
npm run test:e2e

# 3. Navigate to form
# http://localhost:3000/ideas/submit

# 4. Verify
# - Form loads with categories
# - Validation works
# - Submission succeeds
# - Idea appears in database
```

---

## Key Implementation Notes

1. **Server-Side Sanitization**: Always sanitize on the server, not just the client
2. **Accessibility**: Use semantic HTML, ARIA attributes, and proper labels
3. **Error Handling**: Display user-friendly error messages, preserve form data on error
4. **Retry Logic**: Implement client-side retry for server errors (3 retries, 1s cooldown)
5. **Loading State**: Disable form fields during submission; show loading spinner
6. **Testing**: Write unit tests for validators, integration tests for API route, E2E tests for form workflow
7. **Documentation**: Add JSDoc comments to all functions

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Categories not showing | Verify prisma migration ran; check `isActive` field in database |
| Form submission fails with 401 | Ensure user is authenticated; check NextAuth session |
| Validation errors not showing | Check Zod error handling in API route; verify error response format |
| Special characters not stripped | Test `sanitizeText()` function; verify regex pattern |

---

## Next Steps

1. Create database migration and run it
2. Implement validators and sanitizers
3. Create API route
4. Create React form component
5. Create page component
6. Write tests
7. Integrate into navigation
8. Test end-to-end
