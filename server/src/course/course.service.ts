import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

const ALLOWED_PICTURE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaService } from '../prisma/prisma.service';

// Note: no fileData equivalent here — pictureData is deliberately left out
// of the overview select (same reasoning as content/certificates) and
// served separately through getPicture() so list/detail responses stay small.
const COURSE_OVERVIEW_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
  pictureMime: true,
  pictureName: true,
  requirements: true,
  category: true,
  difficulty: true,
  learningOutcomes: true,
  requiresPreviousCertification: true,
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

  async updateCourse(courseId: string, dto: UpdateCourseDto, picture?: Express.Multer.File) {
    await this.assertCourseExists(courseId);
    return this.prisma.course.update({
      where: { id: courseId },
      data: { ...dto, ...this.picturePayload(picture) },
    });
  }

  private picturePayload(picture?: Express.Multer.File) {
    if (!picture) return {};
    if (!ALLOWED_PICTURE_MIME.includes(picture.mimetype)) {
      throw new BadRequestException('Course picture must be JPEG, PNG, or WebP');
    }
    return {
      pictureData: new Uint8Array(picture.buffer),
      pictureMime: picture.mimetype,
      pictureName: picture.originalname,
    };
  }

  async deleteCourse(courseId: string) {
    await this.assertCourseExists(courseId);
    return this.prisma.course.delete({ where: { id: courseId } });
  }

  // Admins see everything (including drafts); regular users only see published courses.
  findAll(includeDrafts: boolean) {
    return this.prisma.course.findMany({
      where: includeDrafts ? undefined : { isPublished: true },
      select: COURSE_OVERVIEW_SELECT,
    });
  }

  // isStaff = ADMIN/SUPERADMIN. Regular users get NotFound (not Forbidden)
  // for an unpublished course — don't reveal that a draft course exists.
  async findOne(courseId: string, isStaff: boolean) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: COURSE_OVERVIEW_SELECT,
    });
    if (!course || (!course.isPublished && !isStaff)) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async publishCourse(courseId: string) {
    await this.assertCourseExists(courseId);
    return this.prisma.course.update({
      where: { id: courseId },
      data: { isPublished: true },
      select: COURSE_OVERVIEW_SELECT,
    });
  }

  async unpublishCourse(courseId: string) {
    await this.assertCourseExists(courseId);
    return this.prisma.course.update({
      where: { id: courseId },
      data: { isPublished: false },
      select: COURSE_OVERVIEW_SELECT,
    });
  }

  // Same visibility rule as findOne — draft course pictures are staff-only.
  async getPicture(courseId: string, isStaff: boolean) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || (!course.isPublished && !isStaff)) {
      throw new NotFoundException('Course not found');
    }
    if (!course.pictureData) throw new NotFoundException('This course has no picture');
    return {
      fileData: course.pictureData,
      mimeType: course.pictureMime,
      fileName: course.pictureName,
    };
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

  private async assertCourseExists(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
  }
}
