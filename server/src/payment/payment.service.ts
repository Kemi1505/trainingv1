import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../common/mail/mail.service';
import { SubmitPaymentDto } from './dto/submit-payment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  // Static account details shown before payment. Move to a DB-backed
  // settings table later if you need multiple accounts/currencies.
  async getAccountInfo(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return {
      accountName: this.config.get<string>('PAYMENT_ACCOUNT_NAME'),
      accountNumber: this.config.get<string>('PAYMENT_ACCOUNT_NUMBER'),
      bankName: this.config.get<string>('PAYMENT_BANK_NAME'),
      amountDue: course.price,
      steps: [
        'Transfer the exact amount shown above to the account provided.',
        'Come back and submit the amount you paid and the name on your account.',
        'An admin will confirm your payment and unlock the course.',
      ],
    };
  }

  async submitPayment(
    userId: string,
    userEmail: string,
    courseId: string,
    dto: SubmitPaymentDto,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new NotFoundException('Enroll in the course before submitting payment');
    }
    if (enrollment.paymentStatus === 'APPROVED') {
      throw new ConflictException('Payment already approved for this course');
    }

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if(!course){
      throw new NotFoundException('Enroll in course first')
    }

    const submission = await this.prisma.paymentSubmission.create({
      data: {
        userId,
        courseId,
        amountPaid: dto.amountPaid,
        payerAccountName: dto.payerAccountName,
      },
    });

    await this.mailService.notifyAdminOfPaymentSubmission({
      payerEmail: userEmail,
      courseTitle: course.title,
      amountPaid: dto.amountPaid,
      payerAccountName: dto.payerAccountName,
      submissionId: submission.id,
    });

    return submission;
  }

  // Admin/Superadmin only (enforced in the controller)
  listPending() {
    return this.prisma.paymentSubmission.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async confirm(submissionId: string, reviewerId: string) {
    const submission = await this.getSubmissionOrThrow(submissionId);

    // A transaction so the submission and the enrollment flip together —
    // no window where one says approved and the other doesn't.
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.paymentSubmission.update({
        where: { id: submissionId },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: reviewerId },
      });

      await tx.enrollment.update({
        where: {
          userId_courseId: { userId: submission.userId, courseId: submission.courseId },
        },
        data: { paymentStatus: 'APPROVED' },
      });

      return updated;
    });
  }

  async reject(submissionId: string, reviewerId: string) {
    await this.getSubmissionOrThrow(submissionId);
    return this.prisma.paymentSubmission.update({
      where: { id: submissionId },
      data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: reviewerId },
    });
  }

  private async getSubmissionOrThrow(submissionId: string) {
    const submission = await this.prisma.paymentSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Payment submission not found');
    return submission;
  }
}
