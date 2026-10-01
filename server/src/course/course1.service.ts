import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_PICTURE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const COURSE_OVERVIEW_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
  pictureMime: true,
  pictureName: true,
  requirements: true,
  isPublished: true,
} as const;

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  createCourse(dto: CreateCourseDto, picture?: Express.Multer.File) {
    return this.prisma.course.create({
      data: { ...dto, ...this.picturePayload(picture) },
    });
  }

   private picturePayload(picture?: Express.Multer.File) {
    if (!picture) return {};
    if (!ALLOWED_PICTURE_MIME.includes(picture.mimetype)) {
      throw new BadRequestException('Course picture must be JPEG, PNG, or WebP');
    }
    return { pictureData: new Uint8Array(picture.buffer), pictureMime: picture.mimetype, pictureName: picture.originalname };
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto) {
    await this.assertCourseExists(courseId);
    return this.prisma.course.update({ where: { id: courseId }, data: dto });
  }

  async deleteCourse(courseId: string) {
    await this.assertCourseExists(courseId);
    return this.prisma.course.delete({ where: { id: courseId } });
  }
  async publishCourse(courseId: string) {
    await this.assertCourseExists(courseId);

    return this.prisma.course.update({
      where: { id: courseId },
      data: { isPublished: true },
    });
  }

  async unpublishCourse(courseId: string) {
    await this.assertCourseExists(courseId);

    return this.prisma.course.update({
      where: { id: courseId },
      data: { isPublished: false },
    });
  }

  // Admins see everything (including drafts); regular users only see published courses.
  findAll(includeDrafts: boolean) {
    return this.prisma.course.findMany({
      where: includeDrafts ? undefined : { isPublished: true },
      select: COURSE_OVERVIEW_SELECT,
    });
  }

  async findOne(courseId: string, isStaff: boolean) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: COURSE_OVERVIEW_SELECT });
    if (!course || (!course.isPublished && !isStaff)) {
      throw new NotFoundException('Course not found'); // NotFound, not Forbidden — don't reveal drafts exist
    }
    return course;
  }

  // Creates the enrollment "intent" — payment happens separately via
  // the payment module, which flips paymentStatus to APPROVED.
  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || !course.isPublished) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('Already enrolled in this course');

    return this.prisma.enrollment.create({ data: { userId, courseId } });
  }

  async getPicture(courseId: string, isStaff: boolean) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        isPublished: true,
        pictureData: true,
        pictureMime: true,
        pictureName: true,
      },
    });

    if (!course || (!course.isPublished && !isStaff)) {
      throw new NotFoundException('Course not found');
    }

    if (!course.pictureData || !course.pictureMime) {
      throw new NotFoundException('Course picture not found');
    }

    return {
      data: course.pictureData,
      mime: course.pictureMime,
      name: course.pictureName,
    };
  }

  private async assertCourseExists(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
  }
}
