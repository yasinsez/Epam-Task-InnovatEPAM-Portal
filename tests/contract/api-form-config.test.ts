import { z } from 'zod';

const formFieldDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  fieldType: z.enum([
    'TEXT',
    'LONG_TEXT',
    'NUMBER',
    'SINGLE_SELECT',
    'MULTI_SELECT',
    'CHECKBOX',
    'DATE',
  ]),
  required: z.boolean(),
  displayOrder: z.number(),
  options: z.array(z.string()).nullable(),
  minValue: z.number().nullable(),
  maxValue: z.number().nullable(),
  maxLength: z.number().nullable(),
});

const getFormConfigSuccessSchema = z.object({
  success: z.literal(true),
  formConfig: z.object({
    id: z.string(),
    updatedAt: z.string(),
    updatedById: z.string().nullable(),
    fields: z.array(formFieldDefinitionSchema),
  }),
});

const putFormConfigSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  formConfig: z.object({
    id: z.string(),
    updatedAt: z.string(),
    updatedById: z.string().nullable(),
    fields: z.array(formFieldDefinitionSchema),
  }),
});

const formConfigErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
  details: z.record(z.array(z.string())).optional(),
});

describe('api-form-config contract: GET /api/admin/form-config', () => {
  it('accepts valid GET success response with fields', () => {
    const payload = {
      success: true,
      formConfig: {
        id: 'cfg_abc123',
        updatedAt: '2026-02-28T10:00:00.000Z',
        updatedById: 'user_456',
        fields: [
          {
            id: 'fld_def456',
            label: 'Department',
            fieldType: 'SINGLE_SELECT',
            required: true,
            displayOrder: 0,
            options: ['Engineering', 'Product'],
            minValue: null,
            maxValue: null,
            maxLength: null,
          },
        ],
      },
    };
    expect(getFormConfigSuccessSchema.parse(payload)).toBeTruthy();
  });

  it('accepts valid GET success response with empty fields', () => {
    const payload = {
      success: true,
      formConfig: {
        id: 'cfg_abc123',
        updatedAt: '2026-02-28T10:00:00.000Z',
        updatedById: null,
        fields: [],
      },
    };
    expect(getFormConfigSuccessSchema.parse(payload)).toBeTruthy();
  });

  it('accepts valid error response', () => {
    const payload = {
      success: false,
      error: 'Forbidden',
    };
    expect(formConfigErrorSchema.parse(payload)).toBeTruthy();
  });
});

describe('api-form-config contract: PUT /api/admin/form-config', () => {
  it('accepts valid PUT success response', () => {
    const payload = {
      success: true,
      message: 'Form configuration updated',
      formConfig: {
        id: 'cfg_abc123',
        updatedAt: '2026-02-28T10:00:00.000Z',
        updatedById: 'user_456',
        fields: [
          {
            id: 'fld_def456',
            label: 'Department',
            fieldType: 'SINGLE_SELECT',
            required: true,
            displayOrder: 0,
            options: ['Engineering', 'Product'],
            minValue: null,
            maxValue: null,
            maxLength: null,
          },
        ],
      },
    };
    expect(putFormConfigSuccessSchema.parse(payload)).toBeTruthy();
  });

  it('accepts valid PUT error response with field-level details', () => {
    const payload = {
      success: false,
      details: {
        'fields[0].label': ['Label must be 1–100 characters'],
        'fields[1].options': ['Options required for SINGLE_SELECT'],
      },
    };
    expect(formConfigErrorSchema.parse(payload)).toBeTruthy();
  });
});
