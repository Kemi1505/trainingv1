import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtPayLoad, type RequestWithJWT } from '../auth/types/auth-types';

@UseGuards(JwtGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(Role.SUPERADMIN)
  @Post('create')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @Roles(Role.SUPERADMIN)
  @Patch(':userId/role')
  assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @Req() req: RequestWithJWT,
  ) {
    const actingUser = req.user as JwtPayLoad;
    return this.adminService.assignRole(userId, dto.role, actingUser.sub);
  }

  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }
}
