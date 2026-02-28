import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

import { requireRole } from '@/lib/auth/role-guards';
import { resolveUserIdForDb } from '@/lib/auth/roles';
import { getUploadConfig, updateUploadConfig } from '@/lib/services/upload-config-service';
import { authOptions } from '@/server/auth/route';

const EXT_REGEX = /^\.[a-z0-9]+$/;
const MIME_REGEX = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9.-]*$/i;

const PutUploadConfigSchema = z
  .object({
    maxFileCount: z.number().int().min(1).max(50),
    maxFileSizeBytes: z.number().int().min(1).max(100 * 1024 * 1024),
    maxTotalSizeBytes: z.number().int().min(1).max(500 * 1024 * 1024),
    allowedExtensions: z
      .array(z.string().regex(EXT_REGEX, 'Each extension must match .[a-z0-9]+'))
      .min(1, 'allowedExtensions must not be empty'),
    mimeByExtension: z.record(z.string(), z.string()),
  })
  .superRefine((data, ctx) => {
    for (const ext of data.allowedExtensions) {
      if (!(ext in data.mimeByExtension)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `mimeByExtension must include key for ${ext}`,
          path: ['mimeByExtension'],
        });
        return;
      }
    }
    for (const [ext, mime] of Object.entries(data.mimeByExtension)) {
      if (!data.allowedExtensions.includes(ext)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `mimeByExtension key ${ext} must be in allowedExtensions`,
          path: ['mimeByExtension'],
        });
        return;
      }
      if (!MIME_REGEX.test(mime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid MIME type: ${mime}`,
          path: ['mimeByExtension', ext],
        });
      }
    }
  });

/**
 * GET /api/admin/upload-config
 * Returns the current upload configuration (admin only).
 */
export const GET = requireRole('admin')(async (
  _request: Request,
  _context: { params: Record<string, string> | Promise<Record<string, string>> },
): Promise<Response> => {
  try {
    const config = await getUploadConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching upload config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load upload configuration' },
      { status: 500 },
    );
  }
});

/**
 * PUT /api/admin/upload-config
 * Updates upload configuration (admin only).
 * Validates per contracts/api-upload-config.md.
 */
export const PUT = requireRole('admin')(async (
  request: Request,
  _context: { params: Record<string, string> | Promise<Record<string, string>> },
): Promise<Response> => {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: { _root: ['Invalid JSON body'] } },
        { status: 400 },
      );
    }

    const parsed = PutUploadConfigSchema.safeParse(body);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.') || '_root';
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
      });
      return NextResponse.json(
        { success: false, error: 'Validation failed', details },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;
    const updatedById = userId && userEmail ? await resolveUserIdForDb(userId, userEmail) : null;

    const config = await updateUploadConfig(parsed.data, updatedById);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error saving upload config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save upload configuration' },
      { status: 500 },
    );
  }
});
