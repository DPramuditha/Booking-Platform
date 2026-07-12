import { IsEmail, IsNotEmpty, IsString, IsUUID, IsDateString, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'Alice Smith', description: 'Customer full name' })
  @IsNotEmpty({ message: 'Customer name is required' })
  @IsString()
  customerName!: string;

  @ApiProperty({ example: 'alice@example.com', description: 'Customer email' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty({ message: 'Customer email is required' })
  customerEmail!: string;

  @ApiProperty({ example: '+1234567890', description: 'Customer phone number' })
  @IsNotEmpty({ message: 'Customer phone is required' })
  @IsString()
  customerPhone!: string;

  @ApiProperty({ example: 'uuid-of-service', description: 'Associated Service ID' })
  @IsNotEmpty({ message: 'Service ID is required' })
  @IsUUID('4', { message: 'Service ID must be a valid UUID' })
  serviceId!: string;

  @ApiProperty({ example: '2026-07-15', description: 'Booking date (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Booking date is required' })
  @IsDateString({}, { message: 'Booking date must be a valid ISO date (YYYY-MM-DD)' })
  bookingDate!: string;

  @ApiProperty({ example: '14:30', description: 'Booking time (HH:MM)' })
  @IsNotEmpty({ message: 'Booking time is required' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Booking time must be in HH:MM format (24-hour)' })
  bookingTime!: string;

  @ApiProperty({ example: 'Special requests or details...', description: 'Optional booking notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
