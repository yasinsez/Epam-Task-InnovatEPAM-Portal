import { createSubmissionSchema } from '@/lib/utils/dynamic-schema';

describe('createSubmissionSchema', () => {
  it('builds schema for TEXT field', () => {
    const schema = createSubmissionSchema([
      {
        id: 'f1',
        label: 'Name',
        fieldType: 'TEXT',
        required: true,
        displayOrder: 0,
        options: null,
        minValue: null,
        maxValue: null,
        maxLength: 50,
      },
    ]);
    expect(schema.safeParse({ f1: 'John' }).success).toBe(true);
    expect(schema.safeParse({ f1: ' ' }).success).toBe(false); // trim yields empty
    expect(schema.safeParse({}).success).toBe(false);
  });

  it('builds schema for optional NUMBER with min/max', () => {
    const schema = createSubmissionSchema([
      {
        id: 'f1',
        label: 'Score',
        fieldType: 'NUMBER',
        required: false,
        displayOrder: 0,
        options: null,
        minValue: 0,
        maxValue: 10,
        maxLength: null,
      },
    ]);
    expect(schema.safeParse({ f1: 5 }).success).toBe(true);
    expect(schema.safeParse({ f1: 0 }).success).toBe(true);
    expect(schema.safeParse({ f1: 10 }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ f1: 11 }).success).toBe(false);
    expect(schema.safeParse({ f1: -1 }).success).toBe(false);
  });

  it('builds schema for SINGLE_SELECT', () => {
    const schema = createSubmissionSchema([
      {
        id: 'f1',
        label: 'Dept',
        fieldType: 'SINGLE_SELECT',
        required: true,
        displayOrder: 0,
        options: ['Eng', 'Product'],
        minValue: null,
        maxValue: null,
        maxLength: null,
      },
    ]);
    expect(schema.safeParse({ f1: 'Eng' }).success).toBe(true);
    expect(schema.safeParse({ f1: 'Product' }).success).toBe(true);
    expect(schema.safeParse({ f1: 'Other' }).success).toBe(false);
  });

  it('builds schema for MULTI_SELECT', () => {
    const schema = createSubmissionSchema([
      {
        id: 'f1',
        label: 'Tags',
        fieldType: 'MULTI_SELECT',
        required: false,
        displayOrder: 0,
        options: ['A', 'B', 'C'],
        minValue: null,
        maxValue: null,
        maxLength: null,
      },
    ]);
    expect(schema.safeParse({ f1: ['A', 'B'] }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ f1: ['X'] }).success).toBe(false);
  });

  it('builds schema for CHECKBOX', () => {
    const schema = createSubmissionSchema([
      {
        id: 'f1',
        label: 'Agree',
        fieldType: 'CHECKBOX',
        required: true,
        displayOrder: 0,
        options: null,
        minValue: null,
        maxValue: null,
        maxLength: null,
      },
    ]);
    expect(schema.safeParse({ f1: true }).success).toBe(true);
    expect(schema.safeParse({ f1: false }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it('builds schema for empty field list', () => {
    const schema = createSubmissionSchema([]);
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ extra: 'x' }).success).toBe(true);
  });
});
