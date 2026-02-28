import { prisma } from '@/server/db/prisma';
import type { FormFieldType } from '@prisma/client';

/**
 * API shape for a form field definition.
 */
export type FormFieldDefinitionDto = {
  id: string;
  label: string;
  fieldType: string;
  required: boolean;
  displayOrder: number;
  options: string[] | null;
  minValue: number | null;
  maxValue: number | null;
  maxLength: number | null;
};

/**
 * API shape for form configuration.
 */
export type FormConfigDto = {
  id: string;
  updatedAt: string;
  updatedById: string | null;
  fields: FormFieldDefinitionDto[];
};

/**
 * Input shape for saving form configuration (fields without ids for new).
 */
export type FormFieldInput = {
  id?: string;
  label: string;
  fieldType: FormFieldType | string;
  required?: boolean;
  displayOrder?: number;
  options?: string[] | null;
  minValue?: number | null;
  maxValue?: number | null;
  maxLength?: number | null;
};

/**
 * Gets the active form configuration with all field definitions ordered by displayOrder.
 * Uses the single FormConfiguration row convention (minimal default if none).
 *
 * @returns Form config with fields, or null if none exists
 */
export async function getActiveConfig(): Promise<FormConfigDto | null> {
  const config = await prisma.formConfiguration.findFirst({
    orderBy: { updatedAt: 'desc' },
    include: {
      formFieldDefinitions: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (!config) return null;

  const fields: FormFieldDefinitionDto[] = config.formFieldDefinitions.map((f) => ({
    id: f.id,
    label: f.label,
    fieldType: f.fieldType,
    required: f.required,
    displayOrder: f.displayOrder,
    options: f.options as string[] | null,
    minValue: f.minValue,
    maxValue: f.maxValue,
    maxLength: f.maxLength,
  }));

  return {
    id: config.id,
    updatedAt: config.updatedAt.toISOString(),
    updatedById: config.updatedById,
    fields,
  };
}

/**
 * Saves form configuration by replacing all FormFieldDefinitions (last-write-wins).
 * Creates a new FormConfiguration if none exists.
 *
 * @param fields - Array of field definitions to save
 * @param updatedById - Optional user ID who made the change (for audit)
 * @returns Updated form config
 */
export async function saveConfig(
  fields: FormFieldInput[],
  updatedById?: string | null,
): Promise<FormConfigDto> {
  let config = await prisma.formConfiguration.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  if (!config) {
    config = await prisma.formConfiguration.create({
      data: { updatedById: updatedById ?? null },
    });
  }

  await prisma.formFieldDefinition.deleteMany({
    where: { formConfigurationId: config.id },
  });

  const orderedFields = [...fields].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  type CreateManyItem = {
    formConfigurationId: string;
    label: string;
    fieldType: FormFieldType;
    required: boolean;
    displayOrder: number;
    options: string[] | null;
    minValue: number | null;
    maxValue: number | null;
    maxLength: number | null;
  };
  const fieldData: CreateManyItem[] = orderedFields.map((f) => ({
    formConfigurationId: config!.id,
    label: f.label,
    fieldType: f.fieldType as FormFieldType,
    required: f.required ?? false,
    displayOrder: f.displayOrder ?? 0,
    options: f.options ?? null,
    minValue: f.minValue ?? null,
    maxValue: f.maxValue ?? null,
    maxLength: f.maxLength ?? null,
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.formFieldDefinition.createMany({ data: fieldData as any });

  await prisma.formConfiguration.update({
    where: { id: config.id },
    data: { updatedById: updatedById ?? null },
  });

  await prisma.authLog.create({
    data: {
      userId: updatedById ?? null,
      action: 'FORM_CONFIG_UPDATED',
      status: 'success',
      metadata: { formConfigId: config.id },
    },
  });

  const saved = await getActiveConfig();
  if (!saved) throw new Error('Failed to fetch saved config');
  return saved;
}
