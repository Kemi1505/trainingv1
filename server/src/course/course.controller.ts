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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayLoad, type RequestWithJWT } from '../auth/types/auth-types';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Response } from 'express';
import { CourseService } from './course.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('picture', { limits: { fileSize: 5 * 1024 * 1024 } }))
  create(@Body() dto: CreateCourseDto, @UploadedFile() picture?: Express.Multer.File) {
    return this.courseService.createCourse(dto, picture);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch(':id/publish')
  publish(@Param('id') id: string) { return this.courseService.publishCourse(id); }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string) { return this.courseService.unpublishCourse(id); }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courseService.updateCourse(id, dto);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.deleteCourse(id);
  }

  // Any authenticated user; admins additionally get unpublished drafts.
  @Get()
  findAll(@Req() req: RequestWithJWT) {
    const user = req.user as JwtPayLoad;
    const isStaff = user.role === Role.ADMIN || user.role === Role.SUPERADMIN;
    return this.courseService.findAll(isStaff);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithJWT) {
    const user = req.user as JwtPayLoad
    const isStaff =
      user.role === Role.ADMIN ||
      user.role === Role.SUPERADMIN;
    return this.courseService.findOne(id, isStaff);
  }

  @Get(':id/picture')
  getPicture(
    @Param('id') id: string, 
    @Req() req: RequestWithJWT){
      const user = req.user as JwtPayLoad
      const isStaff =
        user.role === Role.ADMIN ||
        user.role === Role.SUPERADMIN;
    return this.courseService.getPicture(id, isStaff)
  }
  

  @Post(':id/enroll')
  enroll(@Param('id') id: string, @Req() req: RequestWithJWT) {
    const user = req.user as JwtPayLoad;
    return this.courseService.enroll(user.sub, id);
  }
}
