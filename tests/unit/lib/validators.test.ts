import { validateEmail, validatePassword } from '@/lib/utils/validators';
import {
  SubmitIdeaSchema,
  evaluateIdeaSchema,
  validateAttachmentFile,
  validateAttachments,
} from '@/lib/validators';

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

  describe('validateAttachmentFile', () => {
    it('should accept valid PDF file', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });
      expect(validateAttachmentFile(file)).toEqual({ valid: true });
    });

    it('should accept valid PNG file', () => {
      const file = new File(['x'], 'image.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 500 });
      expect(validateAttachmentFile(file)).toEqual({ valid: true });
    });

    it('should reject empty file (0 bytes)', () => {
      const file = new File([], 'empty.pdf', { type: 'application/pdf' });
      expect(validateAttachmentFile(file)).toEqual({
        valid: false,
        error: 'File is empty. Please select a valid file',
      });
    });

    it('should reject file exceeding 25 MB', () => {
      const file = new File(['x'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 26 * 1024 * 1024 });
      expect(validateAttachmentFile(file)).toEqual({
        valid: false,
        error: 'File is too large. Maximum size is 25 MB',
      });
    });

    it('should reject unsupported file extension', () => {
      const file = new File(['x'], 'script.exe', { type: 'application/x-msdownload' });
      Object.defineProperty(file, 'size', { value: 100 });
      expect(validateAttachmentFile(file)).toEqual({
        valid: false,
        error: 'File type not supported. Accepted formats: PDF, DOCX, PNG, JPG, GIF',
      });
    });

    it('should reject file with extension mismatch (wrong MIME)', () => {
      const file = new File(['x'], 'fake.pdf', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 100 });
      expect(validateAttachmentFile(file)).toEqual({
        valid: false,
        error: 'File type not supported. Accepted formats: PDF, DOCX, PNG, JPG, GIF',
      });
    });
  });

  describe('validateAttachments [US1]', () => {
    const config = {
      maxFileCount: 10,
      maxFileSizeBytes: 10 * 1024 * 1024,
      maxTotalSizeBytes: 50 * 1024 * 1024,
      allowedExtensions: ['.pdf', '.png'],
      mimeByExtension: { '.pdf': 'application/pdf', '.png': 'image/png' },
    };

    it('should accept valid single file', () => {
      const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1000 });
      expect(validateAttachments([file], config)).toEqual({ valid: true });
    });

    it('should accept valid multiple files', () => {
      const f1 = new File(['a'], 'a.pdf', { type: 'application/pdf' });
      const f2 = new File(['b'], 'b.png', { type: 'image/png' });
      Object.defineProperty(f1, 'size', { value: 100 });
      Object.defineProperty(f2, 'size', { value: 200 });
      expect(validateAttachments([f1, f2], config)).toEqual({ valid: true });
    });

    it('should reject when file count exceeds max', () => {
      const files = Array(11)
        .fill(null)
        .map((_, i) => {
          const f = new File(['x'], `doc${i}.pdf`, { type: 'application/pdf' });
          Object.defineProperty(f, 'size', { value: 100 });
          return f;
        });
      const result = validateAttachments(files, config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum file count exceeded');
    });

    it('should reject when per-file size exceeds limit', () => {
      const file = new File(['x'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
      const result = validateAttachments([file], config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds the per-file size limit');
    });

    it('should reject when total size exceeds limit', () => {
      const f1 = new File(['a'], 'a.pdf', { type: 'application/pdf' });
      const f2 = new File(['b'], 'b.pdf', { type: 'application/pdf' });
      Object.defineProperty(f1, 'size', { value: 30 * 1024 * 1024 });
      Object.defineProperty(f2, 'size', { value: 25 * 1024 * 1024 });
      const result = validateAttachments([f1, f2], config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Total attachment size');
    });

    it('should reject disallowed file type', () => {
      const file = new File(['x'], 'script.exe', { type: 'application/x-msdownload' });
      Object.defineProperty(file, 'size', { value: 100 });
      const result = validateAttachments([file], config);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/not allowed|type/);
    });

    it('should reject extension/MIME mismatch', () => {
      const file = new File(['x'], 'doc.pdf', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 100 });
      const result = validateAttachments([file], config);
      expect(result.valid).toBe(false);
    });

    it('should accept empty array', () => {
      expect(validateAttachments([], config)).toEqual({ valid: true });
    });
  });

  describe('evaluateIdeaSchema', () => {
    it('should validate a valid payload', () => {
      const validData = {
        decision: 'ACCEPTED' as const,
        comments: 'This idea aligns well with our innovation goals.',
      };
      expect(() => evaluateIdeaSchema.parse(validData)).not.toThrow();
      expect(evaluateIdeaSchema.parse(validData)).toEqual(validData);
    });

    it('should validate REJECTED decision', () => {
      const validData = {
        decision: 'REJECTED' as const,
        comments: 'Does not fit current priorities.',
      };
      expect(evaluateIdeaSchema.parse(validData)).toEqual(validData);
    });

    it('should reject empty comments', () => {
      const data = {
        decision: 'ACCEPTED',
        comments: '',
      };
      expect(() => evaluateIdeaSchema.parse(data)).toThrow();
    });

    it('should reject comments exceeding 2000 characters', () => {
      const data = {
        decision: 'ACCEPTED',
        comments: 'a'.repeat(2001),
      };
      expect(() => evaluateIdeaSchema.parse(data)).toThrow();
    });

    it('should reject invalid decision', () => {
      const data = {
        decision: 'PENDING',
        comments: 'Some comments',
      };
      expect(() => evaluateIdeaSchema.parse(data)).toThrow();
    });
  });
});
