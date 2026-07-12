import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

const mockUser = {
  id: 'user-uuid',
  email: 'dimuthu@example.com',
  name: 'Dimuthu Pramuditha',
  password: 'hashedpassword',
  role: 'user',
  refreshToken: null,
};

const mockRepository = () => ({
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockImplementation((user) => Promise.resolve({ id: 'user-uuid', ...user })),
  findOne: jest.fn(),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if email is missing', async () => {
      const badData = { name: 'Dimuthu Pramuditha', password: 'password123' };
      await expect(service.create(badData)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValue(mockUser as User);

      const dto = { email: 'dimuthu@example.com', name: 'Dimuthu Pramuditha', password: 'password123' };
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should successfully create, hash password, and return user without password', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('mock-salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const dto = { email: 'dimuthu@example.com', name: 'Dimuthu Pramuditha', password: 'password123' };
      const result = await service.create(dto);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'mock-salt');
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('dimuthu@example.com');
      expect(result.name).toBe('Dimuthu Pramuditha');
    });
  });

  describe('findByEmail', () => {
    it('should call findOne with normalized email', async () => {
      const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValue(mockUser as User);
      const result = await service.findByEmail('  dimuthu@example.com  ');

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: 'dimuthu@example.com' },
        select: ['id', 'email', 'password', 'name', 'role', 'refreshToken'],
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValue(mockUser as User);
      const result = await service.findById('user-uuid');

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: 'user-uuid' } });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateRefreshToken', () => {
    it('should update user with hashed token if token is provided', async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('mock-salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedrefreshtoken');
      const updateSpy = jest.spyOn(repo, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.updateRefreshToken('user-uuid', 'myrefresh');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('myrefresh', 'mock-salt');
      expect(updateSpy).toHaveBeenCalledWith('user-uuid', { refreshToken: 'hashedrefreshtoken' });
    });

    it('should update user with undefined token if token is null', async () => {
      const updateSpy = jest.spyOn(repo, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.updateRefreshToken('user-uuid', null);

      expect(updateSpy).toHaveBeenCalledWith('user-uuid', { refreshToken: undefined });
    });
  });
});
