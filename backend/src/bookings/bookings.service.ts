import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ServicesService } from '../services/services.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private servicesService: ServicesService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // 1. Verify service exists and is active
    const service = await this.servicesService.findOne(createBookingDto.serviceId);
    if (!service.isActive) {
      throw new BadRequestException('Cannot book an inactive service');
    }

    // 2. Validate booking date is not in the past (timezone safe)
    const [year, month, day] = createBookingDto.bookingDate.split('-').map(Number);
    const inputDate = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // 3. Prevent duplicate bookings for the same service, date, and time
    const duplicate = await this.bookingsRepository.findOne({
      where: {
        serviceId: createBookingDto.serviceId,
        bookingDate: createBookingDto.bookingDate,
        bookingTime: createBookingDto.bookingTime,
        status: Not(BookingStatus.CANCELLED),
      },
    });

    if (duplicate) {
      throw new ConflictException('This time slot is already booked for this service');
    }

    // 4. Create and save the booking
    const booking = this.bookingsRepository.create({
      ...createBookingDto,
      status: BookingStatus.PENDING,
    });

    return this.bookingsRepository.save(booking);
  }

  async findAll(query: { page?: number; limit?: number; search?: string; status?: BookingStatus }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.bookingsRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service');

    if (query.status) {
      queryBuilder.andWhere('booking.status = :status', { status: query.status });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(LOWER(booking.customerName) LIKE LOWER(:search) OR LOWER(booking.customerEmail) LIKE LOWER(:search) OR LOWER(booking.customerPhone) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    queryBuilder
      .orderBy('booking.bookingDate', 'DESC')
      .addOrderBy('booking.bookingTime', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.findOne(id);

    // Business Rule: Cancelled bookings cannot be marked as completed
    if (booking.status === BookingStatus.CANCELLED && status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cancelled bookings cannot be marked as completed');
    }

    booking.status = status;
    return this.bookingsRepository.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = BookingStatus.CANCELLED;
    return this.bookingsRepository.save(booking);
  }
}
