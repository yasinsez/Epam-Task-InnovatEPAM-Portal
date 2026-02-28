import { z } from 'zod';

/**
 * Field definition shape for dynamic form schema generation.
 * Matches FormFieldDefinition structure from the API.
 */
export type FieldDefinitionInput = {
  id: string;
  label: string;
  fieldType: string;
  required: boolean;
  displayOrder: number;
  options?: string[] | null;
  minValue?: number | null;
  maxValue?: number | null;
  maxLength?: number | null;
};

/**
 * Creates a Zod schema for validating dynamic field values in idea submission.
 * Maps fieldType to appropriate Zod primitives with required/optional and constraints.
 *
 * @param fieldDefinitions - Array of field definitions ordered by displayOrder
 * @returns Zod object schema for dynamicFieldValues
 *
 * @example
 *   const schema = createSubmissionSchema(fields);
 *   const result = schema.safeParse({ [id]: value });
 */
export function createSubmissionSchema(
  fieldDefinitions: FieldDefinitionInput[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const def of fieldDefinitions) {
    let fieldSchema: z.ZodTypeAny;

    switch (def.fieldType) {
      case 'TEXT': {
        let textSchema: z.ZodString = z.string().trim();
        if (def.required) textSchema = textSchema.min(1, 'This field is required');
        if (def.maxLength != null && def.maxLength > 0) {
          textSchema = textSchema.max(def.maxLength);
        }
        fieldSchema = textSchema;
        break;
      }

      case 'LONG_TEXT':
        fieldSchema = z.string().trim();
        const maxLen = def.maxLength ?? 10000;
        fieldSchema = (fieldSchema as z.ZodString).max(maxLen);
        break;

      case 'NUMBER': {
        let numSchema: z.ZodNumber = z.coerce.number();
        if (def.minValue != null) numSchema = numSchema.min(def.minValue);
        if (def.maxValue != null) numSchema = numSchema.max(def.maxValue);
        fieldSchema = numSchema.refine((n) => !Number.isNaN(n), { message: 'Invalid number' });
        break;
      }

      case 'SINGLE_SELECT':
        if (!def.options || def.options.length === 0) {
          fieldSchema = z.string();
        } else {
          fieldSchema = z.enum(def.options as [string, ...string[]]);
        }
        break;

      case 'MULTI_SELECT':
        if (!def.options || def.options.length === 0) {
          fieldSchema = z.array(z.string());
        } else {
          const optionEnum = z.enum(def.options as [string, ...string[]]);
          fieldSchema = z.array(optionEnum);
        }
        break;

      case 'CHECKBOX':
        fieldSchema = z.boolean();
        break;

      case 'DATE':
        // Accept ISO 8601 date or datetime string (e.g. 2026-02-28 or 2026-02-28T00:00:00.000Z)
        fieldSchema = z.string().refine(
          (s) => /^\d{4}-\d{2}-\d{2}(T[\d:.+-]+Z?)?$/.test(s) && !Number.isNaN(Date.parse(s)),
          { message: 'Invalid date format' },
        );
        break;

      default:
        fieldSchema = z.unknown();
    }

    if (!def.required) {
      fieldSchema = fieldSchema.optional().nullable();
    }

    shape[def.id] = fieldSchema;
  }

  return z.object(shape);
}
