import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { SessionService } from 'src/session/session.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let sessionService: SessionService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockSessionService = {
    create: jest.fn(),
    findByToken: jest.fn(),
    findByRefreshToken: jest.fn(),
    updateLastUsed: jest.fn(),
    revokeSession: jest.fn(),
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    password_hash: 'hashedPassword',
    role: 'user',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    sessionService = module.get<SessionService>(SessionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'password123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockPrismaService.user.findUnique.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateUser('testuser', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return auth tokens on successful login', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');
      mockSessionService.create.mockResolvedValue({});

      const result = await service.login(loginDto, '127.0.0.1', 'Mozilla/5.0');

      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        token_type: 'Bearer',
        expires_in: 900,
      });
      expect(sessionService.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const mockSession = {
      id: 1,
      user_id: 1,
      token: 'old_access_token',
      refresh_token: 'valid_refresh_token',
      expires_at: new Date(Date.now() + 86400000), // 1 day from now
      is_revoked: false,
      user: mockUser,
    };

    it('should return new tokens with valid refresh token', async () => {
      mockSessionService.findByRefreshToken.mockResolvedValue(mockSession);
      mockSessionService.revokeSession.mockResolvedValue({});
      mockJwtService.sign.mockReturnValueOnce('new_access_token').mockReturnValueOnce('new_refresh_token');
      mockSessionService.create.mockResolvedValue({});

      const result = await service.refreshToken('valid_refresh_token');

      expect(sessionService.findByRefreshToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(sessionService.revokeSession).toHaveBeenCalledWith(1);
      expect(result.access_token).toBe('new_access_token');
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      mockSessionService.findByRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken('invalid_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with revoked session', async () => {
      const revokedSession = { ...mockSession, is_revoked: true };
      mockSessionService.findByRefreshToken.mockResolvedValue(revokedSession);

      await expect(service.refreshToken('revoked_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with expired session', async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: new Date(Date.now() - 86400000),
      };
      mockSessionService.findByRefreshToken.mockResolvedValue(expiredSession);

      await expect(service.refreshToken('expired_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke session on logout', async () => {
      const mockSession = {
        id: 1,
        token: 'valid_token',
      };

      mockSessionService.findByToken.mockResolvedValue(mockSession);
      mockSessionService.revokeSession.mockResolvedValue({});

      await service.logout('valid_token');

      expect(sessionService.findByToken).toHaveBeenCalledWith('valid_token');
      expect(sessionService.revokeSession).toHaveBeenCalledWith(1);
    });

    it('should handle logout with invalid token gracefully', async () => {
      mockSessionService.findByToken.mockResolvedValue(null);

      await expect(service.logout('invalid_token')).resolves.not.toThrow();
    });
  });

  describe('validateToken', () => {
    const mockSession = {
      id: 1,
      token: 'valid_token',
      expires_at: new Date(Date.now() + 86400000),
      is_revoked: false,
      user: mockUser,
    };

    it('should return user for valid token', async () => {
      mockSessionService.findByToken.mockResolvedValue(mockSession);
      mockSessionService.updateLastUsed.mockResolvedValue(undefined);

      const result = await service.validateToken('valid_token');

      expect(sessionService.updateLastUsed).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid token', async () => {
      mockSessionService.findByToken.mockResolvedValue(null);

      const result = await service.validateToken('invalid_token');

      expect(result).toBeNull();
    });

    it('should return null for revoked token', async () => {
      const revokedSession = { ...mockSession, is_revoked: true };
      mockSessionService.findByToken.mockResolvedValue(revokedSession);

      const result = await service.validateToken('revoked_token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: new Date(Date.now() - 86400000),
      };
      mockSessionService.findByToken.mockResolvedValue(expiredSession);

      const result = await service.validateToken('expired_token');

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const inactiveUserSession = {
        ...mockSession,
        user: { ...mockUser, is_active: false },
      };
      mockSessionService.findByToken.mockResolvedValue(inactiveUserSession);

      const result = await service.validateToken('valid_token');

      expect(result).toBeNull();
    });
  });
});