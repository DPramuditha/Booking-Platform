import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { Repository } from 'typeorm';

const mockService = {
  id: 'uuid-1',
  title: 'Consultation',
  description: 'Technical consultation',
  duration: 60,
  price: 100,
  isActive: true,
};

const mockRepository = () => ({
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockImplementation((service) => Promise.resolve({ id: 'uuid-1', ...service })),
  find: jest.fn().mockResolvedValue([mockService]),
  findOne: jest.fn().mockResolvedValue(mockService),
  remove: jest.fn().mockResolvedValue(undefined),
});

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: Repository<Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repository = module.get<Repository<Service>>(getRepositoryToken(Service));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a service', async () => {
      const dto = { title: 'New', description: 'Desc', duration: 30, price: 50 };
      const result = await service.create(dto);
      expect(result).toHaveProperty('id');
      expect(result.title).toEqual('New');
    });
  });

  describe('findOne', () => {
    it('should return a service by ID', async () => {
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockService);
    });
  });
});
