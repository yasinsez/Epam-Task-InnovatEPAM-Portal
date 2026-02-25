import fs from 'fs/promises';
import { saveAttachmentFile, readAttachmentFile, deleteAttachmentFile } from '@/lib/services/attachment-service';

jest.mock('fs/promises');

const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
const mockUnlink = fs.unlink as jest.MockedFunction<typeof fs.unlink>;

describe('attachment-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveAttachmentFile', () => {
    it('should create directory and write file, return relative path', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const file = new File(['test content'], 'doc.pdf', { type: 'application/pdf' });
      const storedPath = await saveAttachmentFile('idea-123', file);

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
      expect(storedPath).toMatch(/^ideas\/idea-123\/[a-f0-9-]+\.pdf$/);
    });
  });

  describe('readAttachmentFile', () => {
    it('should return buffer when file exists', async () => {
      const buf = Buffer.from('file content');
      mockReadFile.mockResolvedValue(buf);

      const result = await readAttachmentFile('ideas/idea-123/uuid.pdf');

      expect(result).toEqual(buf);
      expect(mockReadFile).toHaveBeenCalled();
    });

    it('should return null when file not found', async () => {
      mockReadFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

      const result = await readAttachmentFile('ideas/idea-123/missing.pdf');

      expect(result).toBeNull();
    });
  });

  describe('deleteAttachmentFile', () => {
    it('should delete file when it exists', async () => {
      mockUnlink.mockResolvedValue(undefined);

      await deleteAttachmentFile('ideas/idea-123/uuid.pdf');

      expect(mockUnlink).toHaveBeenCalledWith(
        expect.stringContaining('ideas/idea-123/uuid.pdf'),
      );
    });

    it('should not throw when file does not exist', async () => {
      mockUnlink.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

      await expect(deleteAttachmentFile('ideas/idea-123/missing.pdf')).resolves.toBeUndefined();
    });
  });
});
