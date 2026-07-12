import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Service } from '../services/service.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('bookings')
@Index(['serviceId', 'bookingDate', 'bookingTime'], { unique: true, where: `"status" != 'CANCELLED'` })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerName!: string;

  @Column()
  customerEmail!: string;

  @Column()
  customerPhone!: string;

  @Column({ name: 'service_id' })
  serviceId!: string;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'service_id' })
  service!: Service;

  @Column('date')
  bookingDate!: string; // Stored as YYYY-MM-DD string

  @Column()
  bookingTime!: string; // Stored as HH:MM string

  @Column({
    type: 'varchar',
    length: 20,
    default: BookingStatus.PENDING,
  })
  status!: BookingStatus;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
