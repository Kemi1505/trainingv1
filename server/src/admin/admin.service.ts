import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { CreateAdminDto } from './dto/create-admin.dto';
import { PrismaService } from '../prisma/prisma.service';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Only a SUPERADMIN can call this (enforced in the controller).
  // New admins always come in as ADMIN, never SUPERADMIN — promoting
  // someone to SUPERADMIN is a separate, deliberate action via assignRole.
  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: Role.ADMIN,
      },
      select: SAFE_USER_SELECT,
    });
  }

  async assignRole(targetUserId: string, role: Role, actingUserId: string) {
    if (targetUserId === actingUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('User not found');

    if (target.role === Role.SUPERADMIN) {
      throw new ForbiddenException("Cannot change a superadmin's role");
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: SAFE_USER_SELECT,
    });
  }

  async listUsers() {
    return this.prisma.user.findMany({ select: SAFE_USER_SELECT });
  }
}
