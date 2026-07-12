import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../booking.entity';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CONFIRMED, description: 'Target booking status' })
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(BookingStatus, { message: 'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED' })
  status!: BookingStatus;
}
