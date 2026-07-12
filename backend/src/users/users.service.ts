import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const email = userData.email?.toLowerCase().trim();
    if (!email) {
      throw new ConflictException('Email is required');
    }

    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password || '', salt);

    const user = this.usersRepository.create({
      ...userData,
      email,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    // Remove password from returned object
    const { password, ...result } = savedUser;
    return result as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
      select: ['id', 'email', 'password', 'name', 'refreshToken'], // Explicitly select password for login verification
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    let hashedToken: string | undefined;
    if (refreshToken) {
      const salt = await bcrypt.genSalt(10);
      hashedToken = await bcrypt.hash(refreshToken, salt);
    } else {
      hashedToken = undefined;
    }
    await this.usersRepository.update(id, { refreshToken: hashedToken });
  }
}
