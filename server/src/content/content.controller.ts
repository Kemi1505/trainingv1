import {
  Body,
  Controller,
  Delete,
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
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('courses/:courseId/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  add(
    @Param('courseId') courseId: string,
    @Body() dto: CreateContentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.contentService.addContent(courseId, dto, file);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Delete(':contentId')
  remove(
    @Param('courseId') courseId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.contentService.removeContent(courseId, contentId);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch(':contentId')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  update(
    @Param('courseId') courseId: string, 
    @Param('contentId') contentId: string, 
    @Body() dto: UpdateContentDto, 
    @UploadedFile() file?: Express.Multer.File) {
    return this.contentService.updateContent(courseId, contentId, dto, file);
  }
  
  // Metadata list (no bytes) — gated for regular users inside the service.
  @Get()
  list(@Param('courseId') courseId: string, @Req() req: RequestWithJWT) {
    const user = req.user as JwtPayLoad;
    if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      return this.contentService.listForAdmin(courseId);
    }
    return this.contentService.listForUser(courseId, user.sub);
  }

  // The actual PDF — this is the enforcement point for "no access until paid".
  @Get(':contentId/file')
  async getFile(
    @Param('courseId') courseId: string,
    @Param('contentId') contentId: string,
    @Req() req: RequestWithJWT,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as JwtPayLoad;
    const item =
      user.role === Role.ADMIN || user.role === Role.SUPERADMIN
        ? await this.contentService.getFileForAdmin(courseId, contentId)
        : await this.contentService.getFileForUser(courseId, contentId, user.sub);

    res.set({
      'Content-Type': item.mimeType,
      'Content-Disposition': `inline; filename="${item.fileName}"`,
    });
    return new StreamableFile(item.fileData);
  }
}
