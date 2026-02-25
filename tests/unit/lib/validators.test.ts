import { validateEmail, validatePassword } from '@/lib/utils/validators';
import { SubmitIdeaSchema } from '@/lib/validators';

describe('validators', () => {
  it('validates email format', () => {
    expect(validateEmail('employee@epam.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });

  it('validates minimum password length', () => {
    expect(validatePassword('12345678')).toBe(true);
    expect(validatePassword('1234567')).toBe(false);
  });

  describe('SubmitIdeaSchema', () => {
    it('should validate a valid submission', () => {
      const validData = {
        title: 'Valid Idea Title',
        description: 'This is a valid description with enough characters to pass validation',
        categoryId: 'cat_001',
      };
      expect(() => SubmitIdeaSchema.parse(validData)).not.toThrow();
      expect(SubmitIdeaSchema.parse(validData)).toEqual(validData);
    });

    it('should reject title with less than 5 characters', () => {
      const data = {
        title: 'Bad',
        description: 'This is a valid description with enough characters to pass validation',
        categoryId: 'cat_001',
      };
      expect(() => SubmitIdeaSchema.parse(data)).toThrow();
    });

    it('should reject title with more than 100 characters', () => {
      const data = {
        title: 'a'.repeat(101),
        description: 'This is a valid description with enough characters to pass validation',
        categoryId: 'cat_001',
      };
      expect(() => SubmitIdeaSchema.parse(data)).toThrow();
    });

    it('should reject description with less than 20 characters', () => {
      const data = {
        title: 'Valid Title',
        description: 'Too short',
        categoryId: 'cat_001',
      };
      expect(() => SubmitIdeaSchema.parse(data)).toThrow();
    });

    it('should reject description with more than 2000 characters', () => {
      const data = {
        title: 'Valid Title',
        description: 'a'.repeat(2001),
        categoryId: 'cat_001',
      };
      expect(() => SubmitIdeaSchema.parse(data)).toThrow();
    });

    it('should reject empty categoryId', () => {
      const data = {
        title: 'Valid Title',
        description: 'This is a valid description with enough characters to pass validation',
        categoryId: '',
      };
      expect(() => SubmitIdeaSchema.parse(data)).toThrow();
    });

    it('should trim whitespace from title and description', () => {
      const data = {
        title: '  Valid Title  ',
        description: '  This is a valid description with enough characters to pass validation  ',
        categoryId: 'cat_001',
      };
      const result = SubmitIdeaSchema.parse(data);
      expect(result.title).toBe('Valid Title');
      expect(result.description).toBe(
        'This is a valid description with enough characters to pass validation',
      );
    });

    // US2: Form Validation Tests
    it('subtitle: should validate title length constraints (5-100 chars)', () => {
      expect(() =>
        SubmitIdeaSchema.parse({
          title: 'a'.repeat(5),
          description: 'Valid description with enough chars',
          categoryId: 'cat_001',
        }),
      ).not.toThrow();

      expect(() =>
        SubmitIdeaSchema.parse({
          title: 'a'.repeat(100),
          description: 'Valid description with enough chars',
          categoryId: 'cat_001',
        }),
      ).not.toThrow();
    });

    it('subtitle: should validate description length constraints (20-2000 chars)', () => {
      expect(() =>
        SubmitIdeaSchema.parse({
          title: 'Valid Title',
          description: 'a'.repeat(20),
          categoryId: 'cat_001',
        }),
      ).not.toThrow();

      expect(() =>
        SubmitIdeaSchema.parse({
          title: 'Valid Title',
          description: 'a'.repeat(2000),
          categoryId: 'cat_001',
        }),
      ).not.toThrow();
    });

    it('subtitle: should validate categoryId is non-empty string', () => {
      expect(() =>
        SubmitIdeaSchema.parse({
          title: 'Valid Title',
          description: 'Valid description with enough chars',
          categoryId: 'cat_any_id',
        }),
      ).not.toThrow();
    });
  });
});
