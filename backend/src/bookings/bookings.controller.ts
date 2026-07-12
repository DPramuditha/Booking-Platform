import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsAdminGuard } from '../auth/is-admin.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingStatus } from './booking.entity';

@ApiTags('Booking Management')
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking (Public)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid date' })
  @ApiResponse({ status: 409, description: 'Slot already booked' })
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings with pagination, search, and status filters (Admin only)' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Search by customer name, email, or phone' })
  @ApiQuery({ name: 'status', enum: BookingStatus, required: false })
  @ApiResponse({ status: 200, description: 'Paginated bookings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.findAll({ page, limit, search, status });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details of a specific booking (Admin only)' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a booking status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Booking status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition (e.g., cancelled to completed)' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, updateBookingStatusDto.status);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking (Public - via booking UUID)' })
  @ApiResponse({ status: 200, description: 'Booking successfully cancelled' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
