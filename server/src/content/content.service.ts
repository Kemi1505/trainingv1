import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateContentDto } from './dto/create-content.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateContentDto } from './dto/update-content.dto';

const ALLOWED_MIME = 'application/pdf';

// Metadata only — never pulls fileData off the DB row for a list view.
const CONTENT_LIST_SELECT = {
  id: true,
  courseId: true,
  title: true,
  mimeType: true,
  fileName: true,
  order: true,
  createdAt: true,
} as const;

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async addContent(courseId: string, dto: CreateContentDto, file?: Express.Multer.File) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    if (!file) throw new BadRequestException('A PDF file is required');
    if (file.mimetype !== ALLOWED_MIME) {
      throw new BadRequestException('Only PDF manuals are supported right now');
    }

    return this.prisma.contentItem.create({
      data: {
        courseId,
        title: dto.title,
        order: dto.order ?? 0,
        fileData: new Uint8Array(file.buffer),
        mimeType: file.mimetype,
        fileName: file.originalname,
      },
      select: CONTENT_LIST_SELECT,
    });
  }

  async removeContent(courseId: string, contentId: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
    if (!item || item.courseId !== courseId) {
      throw new NotFoundException('Content item not found for this course');
    }
    return this.prisma.contentItem.delete({ where: { id: contentId } });
  }

  // Metadata list — gated the same way the actual file download is.
  async listForUser(courseId: string, userId: string) {
    await this.assertPaidAccess(courseId, userId);
    return this.prisma.contentItem.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: CONTENT_LIST_SELECT,
    });
  }

  listForAdmin(courseId: string) {
    return this.prisma.contentItem.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: CONTENT_LIST_SELECT,
    });
  }

  // Actual PDF bytes. This is the real gate — everything above is just metadata.
  async getFileForUser(courseId: string, contentId: string, userId: string) {
    await this.assertPaidAccess(courseId, userId);
    return this.getFileOrThrow(courseId, contentId);
  }

  getFileForAdmin(courseId: string, contentId: string) {
    return this.getFileOrThrow(courseId, contentId);
  }

  private async getFileOrThrow(courseId: string, contentId: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
    if (!item || item.courseId !== courseId) {
      throw new NotFoundException('Content item not found for this course');
    }
    return item;
  }

  private async assertPaidAccess(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('You are not enrolled in this course');
    if (enrollment.paymentStatus !== 'APPROVED') {
      throw new ForbiddenException('Payment has not been approved for this course yet');
    }
  }

  async updateContent(
    courseId: string,
    contentId: string,
    dto: UpdateContentDto,
    file?: Express.Multer.File,
  ) {
    const item = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!item || item.courseId !== courseId) {
      throw new NotFoundException('Content item not found for this course');
    }

    if (file && file.mimetype !== ALLOWED_MIME) {
      throw new BadRequestException('Only PDF manuals are supported right now');
    }

    return this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title,
        }),

        ...(dto.order !== undefined && {
          order: dto.order,
        }),

        ...(file && {
          fileData: new Uint8Array(file.buffer),
          mimeType: file.mimetype,
          fileName: file.originalname,
        }),
      },
      select: CONTENT_LIST_SELECT,
    });
  }
}
