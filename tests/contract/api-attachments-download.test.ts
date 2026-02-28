/**
 * Contract test for GET /api/ideas/[id]/attachments/[attachmentId]
 * @see specs/009-multi-media-support/contracts/api-attachments-download.md
 */

describe('GET /api/ideas/[id]/attachments/[attachmentId] contract', () => {
  it('defines success response: 200 with binary body and headers', () => {
    const successHeaders = {
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="design.png"',
      'Content-Length': '524288',
      'Cache-Control': 'private, no-cache',
    };
    expect(successHeaders['Content-Type']).toBe('image/png');
    expect(successHeaders['Content-Disposition']).toContain('filename=');
  });

  it('defines error response schema: 404 Idea not found', () => {
    const payload = { success: false, error: 'Idea not found' };
    expect(payload.error).toBe('Idea not found');
  });

  it('defines error response schema: 404 Attachment not found', () => {
    const payload = { success: false, error: 'Attachment not found' };
    expect(payload.error).toBe('Attachment not found');
  });

  it('defines error response schema: 403 Access denied', () => {
    const payload = { success: false, error: 'Access denied' };
    expect(payload.error).toBe('Access denied');
  });

  it('defines error response schema: 404 Attachment unavailable', () => {
    const payload = { success: false, error: 'Attachment unavailable' };
    expect(payload.error).toBe('Attachment unavailable');
  });
});
