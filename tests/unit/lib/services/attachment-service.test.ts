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

    it('should throw when file has no extension', async () => {
      const file = new File(['content'], 'noext', { type: 'application/octet-stream' });

      await expect(saveAttachmentFile('idea-123', file)).rejects.toThrow(
        'No file extension',
      );
      expect(mockMkdir).not.toHaveBeenCalled();
    });

    it('should throw when file has disallowed extension', async () => {
      const file = new File(['content'], 'script.exe', {
        type: 'application/x-msdownload',
      });

      await expect(saveAttachmentFile('idea-123', file)).rejects.toThrow(
        /Extension .* not allowed/,
      );
      expect(mockMkdir).not.toHaveBeenCalled();
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

    it('should rethrow when read fails for non-ENOENT error', async () => {
      mockReadFile.mockRejectedValue(new Error('Permission denied'));

      await expect(readAttachmentFile('ideas/idea-123/file.pdf')).rejects.toThrow(
        'Permission denied',
      );
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

    it('should rethrow when delete fails for non-ENOENT error', async () => {
      mockUnlink.mockRejectedValue(new Error('Permission denied'));

      await expect(
        deleteAttachmentFile('ideas/idea-123/file.pdf'),
      ).rejects.toThrow('Permission denied');
    });
  });
});
