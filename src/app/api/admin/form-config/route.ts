import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { requireRole } from '@/lib/auth/role-guards';
import { resolveUserIdForDb } from '@/lib/auth/roles';
import { getActiveConfig, saveConfig, type FormFieldInput } from '@/lib/services/form-config-service';
import { authOptions } from '@/server/auth/route';

const FormFieldTypeEnum = z.enum([
  'TEXT',
  'LONG_TEXT',
  'NUMBER',
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'CHECKBOX',
  'DATE',
]);

/**
 * Zod schema for PUT body validation.
 * - label 1–100 chars
 * - options required for SINGLE_SELECT, MULTI_SELECT; max 50 items
 * - min ≤ max for NUMBER
 */
const PutFormConfigFieldSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1, 'Label must be 1–100 characters').max(100, 'Label must be 1–100 characters'),
    fieldType: FormFieldTypeEnum,
    required: z.boolean().optional().default(false),
    displayOrder: z.number().int().min(0).optional().default(0),
    options: z.array(z.string()).nullable().optional(),
    minValue: z.number().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    maxLength: z.number().int().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fieldType === 'SINGLE_SELECT' || data.fieldType === 'MULTI_SELECT') {
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Options required for SINGLE_SELECT and MULTI_SELECT',
          path: ['options'],
        });
      } else if (data.options.length > 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Options must not exceed 50 items',
          path: ['options'],
        });
      }
    }
    if (data.fieldType === 'NUMBER' && data.minValue != null && data.maxValue != null) {
      if (data.minValue > data.maxValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'minValue must be less than or equal to maxValue',
          path: ['minValue'],
        });
      }
    }
  });

const PutFormConfigBodySchema = z.object({
  fields: z.array(PutFormConfigFieldSchema),
});

/**
 * GET /api/admin/form-config
 * Returns the current form configuration with all field definitions (admin only).
 */
export const GET = requireRole('admin')(async (
  _request: Request,
  _context: { params: Record<string, string> | Promise<Record<string, string>> },
): Promise<Response> => {
  try {
    const config = await getActiveConfig();
    if (!config) {
      return NextResponse.json({
        success: true,
        formConfig: {
          id: '',
          updatedAt: new Date().toISOString(),
          updatedById: null,
          fields: [],
        },
      });
    }
    return NextResponse.json({ success: true, formConfig: config });
  } catch (error) {
    console.error('Error fetching form config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load form configuration' },
      { status: 500 },
    );
  }
});

/**
 * PUT /api/admin/form-config
 * Replaces the entire form configuration (admin only).
 * Validates fields: label 1–100, options for selects, min ≤ max for number.
 */
export const PUT = requireRole('admin')(async (request: Request, _context: { params: Record<string, string> | Promise<Record<string, string>> }): Promise<Response> => {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, details: { _root: ['Invalid JSON body'] } },
        { status: 400 },
      );
    }

    const parsed = PutFormConfigBodySchema.safeParse(body);
    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
      });
      return NextResponse.json({ success: false, details }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;
    const updatedById =
      userId && userEmail ? await resolveUserIdForDb(userId, userEmail) : null;

    const fields: FormFieldInput[] = parsed.data.fields.map((f) => ({
      id: f.id,
      label: f.label,
      fieldType: f.fieldType,
      required: f.required,
      displayOrder: f.displayOrder,
      options: f.options ?? null,
      minValue: f.minValue ?? null,
      maxValue: f.maxValue ?? null,
      maxLength: f.maxLength ?? null,
    }));

    const formConfig = await saveConfig(fields, updatedById);
    return NextResponse.json({
      success: true,
      message: 'Form configuration updated',
      formConfig,
    });
  } catch (error) {
    console.error('Error saving form config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save form configuration' },
      { status: 500 },
    );
  }
});
