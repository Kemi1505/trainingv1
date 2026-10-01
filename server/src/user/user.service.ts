import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { CertificationStatus } from '../common/enums/certification-status.enum';
import { CreateProfileDto } from './dto/create-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '../common/enums/payment-status.enum';

const ALLOWED_CERTIFICATE_MIME = ['application/pdf', 'image/png'];

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('Profile already exists — use update instead');
    }

    return this.prisma.profile.create({
      data: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        company: dto.company,
        phone: dto.phone,
        hasPreviousCertification: dto.hasPreviousCertification,
        // Status stays NONE even if they said "yes" here — it only moves to
        // PENDING once they actually upload the file via uploadCertificate.
        certificationStatus: CertificationStatus.NONE,
      },
    });
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found — complete it first');
    return profile;
  }

  async uploadCertificate(userId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_CERTIFICATE_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Certificate must be a PDF or PNG file');
    }

    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Complete your profile first');
    if (!profile.hasPreviousCertification) {
      throw new BadRequestException(
        'Your profile indicates you have no previous certification',
      );
    }

    return this.prisma.profile.update({
      where: { userId },
      data: {
        certificateFile: new Uint8Array(file.buffer),
        certificateMime: file.mimetype,
        certificateName: file.originalname,
        certificationStatus: CertificationStatus.PENDING,
        // Clear any earlier review — a fresh upload needs a fresh look.
        verifiedBy: null,
        verifiedAt: null,
      },
      select: { id: true, certificationStatus: true },
    });
  }

  // Used both for a user fetching their own cert and an admin reviewing someone else's.
  async getCertificateFile(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile?.certificateFile) {
      throw new NotFoundException('No certificate on file for this user');
    }
    return {
      fileData: profile.certificateFile,
      mimeType: profile.certificateMime,
      fileName: profile.certificateName,
    };
  }

  async listPendingCertifications() {
    return this.prisma.profile.findMany({
      where: { certificationStatus: CertificationStatus.PENDING },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        certificateName: true,
        certificateMime: true,
        user: { select: { email: true } },
      },
    });
  }

  async reviewCertification(
    profileUserId: string,
    decision: 'VERIFIED' | 'REJECTED',
    reviewerId: string,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: profileUserId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.profile.update({
      where: { userId: profileUserId },
      data: {
        certificationStatus: decision as CertificationStatus,
        verifiedBy: reviewerId,
        verifiedAt: new Date(),
      },
    });
  }

  async getDashboard(userId: string, role: Role) {
    if (role === Role.ADMIN || role === Role.SUPERADMIN) {
      const [
        pendingCertifications,
        approvedCertificates,
        pendingPayments,
        approvedPayments,
        totalUsers,
        totalCourses,
        totalPublished,
        totalUnpublished,
        courses,
        enrollments,
      ] = await Promise.all([
        this.prisma.profile.count({
          where: {
            certificationStatus: CertificationStatus.PENDING,
          },
        }),

        this.prisma.profile.count({
          where: {
            certificationStatus: CertificationStatus.VERIFIED,
          },
        }),

        this.prisma.paymentSubmission.count({
          where: {
            status: PaymentStatus.PENDING,
          },
        }),

        this.prisma.paymentSubmission.count({
          where: {
            status: PaymentStatus.APPROVED,
          },
        }),

        this.prisma.user.count(),

        this.prisma.course.count(),

        this.prisma.course.count({
          where: {
            isPublished: true,
          },
        }),

        this.prisma.course.count({
          where: {
            isPublished: false,
          },
        }),

        this.prisma.course.findMany({
          select: {
            id: true,
            title: true,
            price: true,
            isPublished: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),

        this.prisma.enrollment.findMany({
          select: {
            paymentStatus: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            enrolledAt: 'desc',
          },
        }),
      ]);

      return {
        type: 'admin',
        pendingCertifications,
        approvedCertificates,
        pendingPayments,
        approvedPayments,
        totalUsers,
        totalCourses,
        totalPublished,
        totalUnpublished,
        courses,
        enrollments,
      };
    }

    const [profile, enrollments] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.enrollment.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true } } },
      }),
    ]);

    return {
      type: 'user',
      profileComplete: !!profile,

      profile: profile
        ? {
            firstName: profile.firstName,
            lastName: profile.lastName,
          }
        : null,

      certificationStatus: profile?.certificationStatus ?? null,

      enrollments: enrollments.map((enrollment) => ({
        id: enrollment.id,
        course: enrollment.course,
        paymentStatus: enrollment.paymentStatus,
      })),
    };
  }
}
