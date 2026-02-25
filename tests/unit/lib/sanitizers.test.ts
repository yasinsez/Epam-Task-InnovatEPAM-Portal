import { sanitizeText } from '@/lib/sanitizers';

describe('sanitizeText', () => {
  it('should remove HTML tags and special characters', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('scriptalertxssscript');
  });

  it('should preserve alphanumeric characters', () => {
    expect(sanitizeText('Hello123World')).toBe('Hello123World');
  });

  it('should preserve spaces', () => {
    expect(sanitizeText('Hello World')).toBe('Hello World');
  });

  it('should preserve hyphens, periods, and commas', () => {
    expect(sanitizeText('Process-Improvement: Hello, world.')).toBe(
      'Process-Improvement Hello, world.',
    );
  });

  it('should remove special characters like @, #, $, %', () => {
    expect(sanitizeText('Hello@World#Test$Price%Discount')).toBe('HelloWorldTestPriceDiscount');
  });

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('should remove HTML entities', () => {
    expect(sanitizeText('&lt;div&gt;&amp;&quot;')).toBe('ltdivgtampquot');
  });

  it('should remove parentheses and brackets', () => {
    expect(sanitizeText('Test (example) [note] {data}')).toBe('Test example note data');
  });

  it('should remove exclamation marks and question marks', () => {
    expect(sanitizeText('What!? Really!!')).toBe('What Really');
  });

  it('should handle text with multiple consecutive special characters', () => {
    expect(sanitizeText('Hello!!!World')).toBe('HelloWorld');
    expect(sanitizeText('Test---Multiple---Hyphens')).toBe('Test---Multiple---Hyphens');
  });
});
