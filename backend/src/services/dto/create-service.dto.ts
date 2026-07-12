import { IsNotEmpty, IsString, IsNumber, IsInt, IsPositive, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Consultation & Strategy', description: 'The title of the service' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title!: string;

  @ApiProperty({ example: '1-on-1 session to define technical goals.', description: 'The description of the service' })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 60, description: 'Duration of the service' })
  @IsNotEmpty({ message: 'Duration is required' })
  @IsInt({ message: 'Duration must be an integer' })
  @IsPositive({ message: 'Duration must be positive' })
  duration!: number;

  @ApiProperty({ example: 'minutes', description: 'Duration unit of measurement', enum: ['minutes', 'hours', 'days'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['minutes', 'hours', 'days'], { message: 'durationUnit must be one of: minutes, hours, days' })
  durationUnit?: string;

  @ApiProperty({ example: 120.00, description: 'Price of the service' })
  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be positive' })
  price!: number;

  @ApiProperty({ example: true, description: 'Is this service currently active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
