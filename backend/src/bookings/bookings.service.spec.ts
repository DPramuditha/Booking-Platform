import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking, BookingStatus } from './booking.entity';
import { ServicesService } from '../services/services.service';
import { Repository } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';

const mockService = {
  id: 'service-uuid',
  title: 'Consultation',
  isActive: true,
};

const mockServicesService = {
  findOne: jest.fn().mockResolvedValue(mockService),
};

const mockBooking = {
  id: 'booking-uuid',
  customerName: 'John',
  customerEmail: 'john@example.com',
  customerPhone: '12345',
  serviceId: 'service-uuid',
  bookingDate: '2026-08-01',
  bookingTime: '12:00',
  status: BookingStatus.PENDING,
};

const mockRepository = () => ({
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockImplementation((b) => Promise.resolve({ id: 'booking-uuid', ...b })),
  findOne: jest.fn(),
});

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingsRepo: Repository<Booking>;
  let servicesService: ServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
        {
          provide: getRepositoryToken(Booking),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingsRepo = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    servicesService = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should reject booking in the past', async () => {
      const pastDto = {
        customerName: 'John',
        customerEmail: 'john@example.com',
        customerPhone: '12345',
        serviceId: 'service-uuid',
        bookingDate: '2020-01-01', // Date in the past
        bookingTime: '12:00',
      };
      await expect(service.create(pastDto)).rejects.toThrow(BadRequestException);
    });

    it('should reject booking if duplicate exists', async () => {
      // Mock findOne to return a duplicate booking
      jest.spyOn(bookingsRepo, 'findOne').mockResolvedValue(mockBooking as any);
      
      const dto = {
        customerName: 'John',
        customerEmail: 'john@example.com',
        customerPhone: '12345',
        serviceId: 'service-uuid',
        bookingDate: '2026-08-01',
        bookingTime: '12:00',
      };
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should prevent moving cancelled bookings to completed', async () => {
      // Mock findOne for retrieve operation in updateStatus
      const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      jest.spyOn(bookingsRepo, 'findOne').mockResolvedValue(cancelledBooking as any);

      await expect(
        service.updateStatus('booking-uuid', BookingStatus.COMPLETED)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject status update if active duplicate booking exists', async () => {
      const existingBooking = { ...mockBooking, status: BookingStatus.PENDING };
      const anotherActiveBooking = { ...mockBooking, id: 'another-booking-uuid', status: BookingStatus.CONFIRMED };
      
      jest.spyOn(bookingsRepo, 'findOne')
        .mockResolvedValueOnce(existingBooking as any)
        .mockResolvedValueOnce(anotherActiveBooking as any);

      await expect(
        service.updateStatus('booking-uuid', BookingStatus.CONFIRMED)
      ).rejects.toThrow(ConflictException);
    });
  });
});
