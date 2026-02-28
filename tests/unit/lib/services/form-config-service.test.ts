import { getActiveConfig, saveConfig } from '@/lib/services/form-config-service';

jest.mock('@/server/db/prisma', () => ({
  prisma: {
    formConfiguration: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    formFieldDefinition: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    authLog: {
      create: jest.fn(),
    },
  },
}));

describe('form-config-service', () => {
  const prisma = jest.requireMock('@/server/db/prisma').prisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveConfig', () => {
    it('returns null when no config exists', async () => {
      prisma.formConfiguration.findFirst.mockResolvedValue(null);
      const result = await getActiveConfig();
      expect(result).toBeNull();
    });

    it('returns config with fields ordered by displayOrder', async () => {
      prisma.formConfiguration.findFirst.mockResolvedValue({
        id: 'cfg1',
        updatedAt: new Date('2026-02-28T10:00:00Z'),
        updatedById: 'user1',
        formFieldDefinitions: [
          {
            id: 'f2',
            label: 'Field B',
            fieldType: 'NUMBER',
            required: false,
            displayOrder: 0,
            options: null,
            minValue: 0,
            maxValue: 10,
            maxLength: null,
          },
          {
            id: 'f1',
            label: 'Field A',
            fieldType: 'TEXT',
            required: true,
            displayOrder: 1,
            options: null,
            minValue: null,
            maxValue: null,
            maxLength: null,
          },
        ],
      });

      const result = await getActiveConfig();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('cfg1');
      expect(result!.fields).toHaveLength(2);
      expect(result!.fields[0].displayOrder).toBe(0);
      expect(result!.fields[0].label).toBe('Field B');
      expect(result!.fields[1].label).toBe('Field A');
    });
  });

  describe('saveConfig', () => {
    it('creates new config and fields when none exists', async () => {
      const savedConfig = {
        id: 'cfg-new',
        updatedAt: new Date(),
        updatedById: null,
        formFieldDefinitions: [
          {
            id: 'f1',
            label: 'Dept',
            fieldType: 'SINGLE_SELECT',
            required: true,
            displayOrder: 0,
            options: ['Eng'],
            minValue: null,
            maxValue: null,
            maxLength: null,
          },
        ],
      };

      prisma.formConfiguration.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(savedConfig);

      prisma.formConfiguration.create.mockResolvedValue({
        id: 'cfg-new',
        updatedAt: new Date(),
        updatedById: null,
      });

      prisma.formFieldDefinition.deleteMany.mockResolvedValue({ count: 0 });
      prisma.formFieldDefinition.createMany.mockResolvedValue({ count: 1 });
      prisma.formConfiguration.update.mockResolvedValue({});

      const result = await saveConfig(
        [
          {
            label: 'Dept',
            fieldType: 'SINGLE_SELECT',
            required: true,
            displayOrder: 0,
            options: ['Eng'],
          },
        ],
        null,
      );

      expect(prisma.formConfiguration.create).toHaveBeenCalled();
      expect(prisma.formFieldDefinition.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            label: 'Dept',
            fieldType: 'SINGLE_SELECT',
            required: true,
          }),
        ]),
      });
      expect(prisma.authLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'FORM_CONFIG_UPDATED',
          status: 'success',
        }),
      });
      expect(result).not.toBeNull();
      expect(result.fields).toHaveLength(1);
    });
  });
});
