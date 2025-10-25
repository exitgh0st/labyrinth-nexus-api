import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PrismaService } from 'src/prisma.service';

describe('SessionService', () => {
  let service: SessionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    session: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockSession = {
    id: 1,
    user_id: 1,
    token: 'access_token_123',
    refresh_token: 'refresh_token_123',
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    expires_at: new Date('2025-12-31'),
    created_at: new Date('2025-01-01'),
    last_used_at: new Date('2025-01-01'),
    is_revoked: false,
  };

  const mockSafeSession = {
    id: 1,
    user_id: 1,
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    expires_at: new Date('2025-12-31'),
    created_at: new Date('2025-01-01'),
    last_used_at: new Date('2025-01-01'),
    is_revoked: false,
    user: {
      id: 1,
      username: 'testuser',
      role: 'user',
      is_active: true,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const createData = {
        user_id: 1,
        token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        expires_at: new Date('2025-12-31'),
      };

      mockPrismaService.session.create.mockResolvedValue(mockSession);

      const result = await service.create(createData);

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('findAll', () => {
    it('should return sessions with default pagination', async () => {
      mockPrismaService.session.findMany.mockResolvedValue([mockSafeSession]);

      const result = await service.findAll();

      expect(prisma.session.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          expires_at: { gte: expect.any(Date) },
        },
        select: expect.any(Object),
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual([mockSafeSession]);
    });

    it('should filter by user_id', async () => {
      mockPrismaService.session.findMany.mockResolvedValue([mockSafeSession]);

      await service.findAll({ user_id: 1 });

      expect(prisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 1,
          }),
        }),
      );
    });

    it('should filter by is_revoked', async () => {
      mockPrismaService.session.findMany.mockResolvedValue([mockSafeSession]);

      await service.findAll({ is_revoked: true });

      expect(prisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_revoked: true,
          }),
        }),
      );
    });

    it('should include expired sessions when requested', async () => {
      mockPrismaService.session.findMany.mockResolvedValue([mockSafeSession]);

      await service.findAll({ include_expired: true });

      expect(prisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            expires_at: expect.anything(),
          }),
        }),
      );
    });
  });

  describe('findByToken', () => {
    it('should return session by token', async () => {
      const sessionWithUser = { ...mockSession, user: {} };
      mockPrismaService.session.findUnique.mockResolvedValue(sessionWithUser);

      const result = await service.findByToken('access_token_123');

      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { token: 'access_token_123' },
        include: { user: true },
      });
      expect(result).toEqual(sessionWithUser);
    });

    it('should return null if session not found', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);

      const result = await service.findByToken('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByRefreshToken', () => {
    it('should return session by refresh token', async () => {
      const sessionWithUser = { ...mockSession, user: {} };
      mockPrismaService.session.findUnique.mockResolvedValue(sessionWithUser);

      const result = await service.findByRefreshToken('refresh_token_123');

      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { refresh_token: 'refresh_token_123' },
        include: { user: true },
      });
      expect(result).toEqual(sessionWithUser);
    });
  });

  describe('updateLastUsed', () => {
    it('should update last_used_at timestamp', async () => {
      mockPrismaService.session.update.mockResolvedValue(mockSession);

      await service.updateLastUsed(1);

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { last_used_at: expect.any(Date) },
      });
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      mockPrismaService.session.update.mockResolvedValue(mockSafeSession);

      const result = await service.revokeSession(1);

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { is_revoked: true },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockSafeSession);
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all active sessions for a user', async () => {
      mockPrismaService.session.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.revokeAllUserSessions(1);

      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          is_revoked: false,
        },
        data: { is_revoked: true },
      });
      expect(result).toBe(3);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      mockPrismaService.session.delete.mockResolvedValue(mockSafeSession);

      const result = await service.deleteSession(1);

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockSafeSession);
    });
  });

  describe('deleteExpiredSessions', () => {
    it('should delete all expired sessions', async () => {
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.deleteExpiredSessions();

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expires_at: { lt: expect.any(Date) },
        },
      });
      expect(result).toBe(5);
    });
  });

  describe('deleteRevokedSessions', () => {
    it('should delete revoked sessions older than specified days', async () => {
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 10 });

      const result = await service.deleteRevokedSessions(30);

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          is_revoked: true,
          created_at: { lt: expect.any(Date) },
        },
      });
      expect(result).toBe(10);
    });

    it('should use default 30 days if not specified', async () => {
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 10 });

      await service.deleteRevokedSessions();

      expect(prisma.session.deleteMany).toHaveBeenCalled();
    });
  });
});