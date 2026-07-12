import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const mockUser = {
  id: 'user-uuid',
  email: 'dimuthu@example.com',
  name: 'dimuthu pramuditha',
  password: 'hashedpassword',
  role: 'user',
  refreshToken: 'hashedrefreshtoken',
};

const mockUsersService = {
  create: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'user-uuid', ...dto })),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  updateRefreshToken: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('jwt-token'),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key, defaultVal) => defaultVal || `${key}-value`),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should forward data to UsersService.create', async () => {
      const dto = { email: 'dimuthu@example.com', name: 'dimuthu pramuditha', password: 'password123' };
      const createSpy = jest.spyOn(usersService, 'create');

      const result = await service.register(dto as any);
      expect(createSpy).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('id', 'user-uuid');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const dto = { email: 'wrong@example.com', password: 'password123' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password verification fails', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const dto = { email: 'john@example.com', password: 'wrongpassword' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return user and tokens if login is successful', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      const updateTokenSpy = jest.spyOn(usersService, 'updateRefreshToken');

      const dto = { email: 'john@example.com', password: 'password123' };
      const result = await service.login(dto);

      expect(updateTokenSpy).toHaveBeenCalledWith('user-uuid', 'refresh-token');
      expect(result).toEqual({
        user: {
          id: 'user-uuid',
          email: 'dimuthu@example.com',
          name: 'dimuthu pramuditha',
          role: 'user',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if user or refresh token is not found', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      await expect(service.refresh('user-uuid', 'sometoken')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token verification fails', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('user-uuid', 'wrongrefresh')).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens if validation is successful', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      const updateTokenSpy = jest.spyOn(usersService, 'updateRefreshToken');

      const result = await service.refresh('user-uuid', 'validrefresh');

      expect(updateTokenSpy).toHaveBeenCalledWith('user-uuid', 'new-refresh-token');
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });
  });

  describe('logout', () => {
    it('should update user refresh token to null', async () => {
      const updateTokenSpy = jest.spyOn(usersService, 'updateRefreshToken');
      const result = await service.logout('user-uuid');

      expect(updateTokenSpy).toHaveBeenCalledWith('user-uuid', null);
      expect(result).toEqual({ success: true });
    });
  });
});
