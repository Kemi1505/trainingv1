import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayLoad, type RequestWithJWT } from '../auth/types/auth-types';
import { UserService } from './user.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ReviewCertificationDto } from './dto/review-certification.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('profile')
  createProfile(@Body() dto: CreateProfileDto, @Req() req: RequestWithJWT) {
    const user = req.user as JwtPayLoad;
    return this.userService.createProfile(user.sub, dto);
  }

  @Get('profile')
  getMyProfile(@Req() req: RequestWithJWT) {
    const user = req.user as JwtPayLoad;
    return this.userService.getMyProfile(user.sub);
  }

  @Post('certificate')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadCertificate(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithJWT,
  ) {
    const user = req.user as JwtPayLoad;
    return this.userService.uploadCertificate(user.sub, file);
  }

  @Get('certificate/file')
  async getMyCertificateFile(
    @Req() req: RequestWithJWT,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as JwtPayLoad;
    const file = await this.userService.getCertificateFile(user.sub);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.fileName}"`,
    });
    return new StreamableFile(file.fileData);
  }

  @Get('dashboard')
  getDashboard(@Req() req: RequestWithJWT) {
    const user = req.user as JwtPayLoad;
    return this.userService.getDashboard(user.sub, user.role);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Get('certifications/pending')
  listPendingCertifications() {
    return this.userService.listPendingCertifications();
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Get('certifications/:userId/file')
  async getCertificateFileForAdmin(
    @Param('userId') targetUserId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.userService.getCertificateFile(targetUserId);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.fileName}"`,
    });
    return new StreamableFile(file.fileData);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch('certifications/:userId/review')
  reviewCertification(
    @Param('userId') targetUserId: string,
    @Body() dto: ReviewCertificationDto,
    @Req() req: RequestWithJWT,
  ) {
    const reviewer = req.user as JwtPayLoad;
    return this.userService.reviewCertification(
      targetUserId,
      dto.decision,
      reviewer.sub,
    );
  }
}
