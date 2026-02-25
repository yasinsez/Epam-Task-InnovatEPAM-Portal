import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getServerSession } from 'next-auth';

import { SubmitIdeaSchema } from '@/lib/validators';
import { sanitizeText } from '@/lib/sanitizers';
import { prisma } from '@/server/db/prisma';

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Formats Zod validation errors into a field-level error object.
 *
 * @param zodError - ZodError from schema validation.
 * @returns Object with field names as keys and arrays of error messages as values.
 */
function formatZodErrors(zodError: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  zodError.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });

  return errors;
}

/**
 * POST /api/ideas
 * Submits a new idea.
 *
 * Authentication: Required (authenticated users only)
 *
 * Request body:
 * - title: string (5-100 characters after trim)
 * - description: string (20-2000 characters after trim)
 * - categoryId: string (must reference an active Category)
 *
 * Responses:
 * - 201 Created: Idea submitted successfully
 * - 400 Bad Request: Validation errors or invalid category
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Server error
 *
 * @example
 * POST /api/ideas
 * { "title": "My Idea", "description": "Description here...", "categoryId": "cat_001" }
 * Returns: { success: true, message: "...", idea: { ... } }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json().catch(() => null);
    const parsed = SubmitIdeaSchema.safeParse(body);

    if (!parsed.success) {
      const errors = formatZodErrors(parsed.error);
      return NextResponse.json({ success: false, details: errors }, { status: 400 });
    }

    const { title, description, categoryId } = parsed.data;

    // Verify category exists and is active
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, details: { categoryId: ['Category not found'] } },
        { status: 400 },
      );
    }

    if (!category.isActive) {
      return NextResponse.json(
        {
          success: false,
          details: { categoryId: ['This category is no longer accepting submissions'] },
        },
        { status: 400 },
      );
    }

    // Sanitize title and description
    const sanitizedTitle = sanitizeText(title);
    const sanitizedDescription = sanitizeText(description);

    // Create idea in database
    const idea = await prisma.idea.create({
      data: {
        title,
        description,
        sanitizedTitle,
        sanitizedDescription,
        categoryId,
        userId,
        status: 'SUBMITTED',
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Idea submitted successfully',
        idea: {
          id: idea.id,
          title: idea.title,
          description: idea.description,
          sanitizedTitle: idea.sanitizedTitle,
          sanitizedDescription: idea.sanitizedDescription,
          categoryId: idea.categoryId,
          userId: idea.userId,
          status: idea.status,
          submittedAt: idea.submittedAt,
          createdAt: idea.createdAt,
          updatedAt: idea.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error submitting idea:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to submit idea. Please try again.' },
      { status: 500 },
    );
  }
}
