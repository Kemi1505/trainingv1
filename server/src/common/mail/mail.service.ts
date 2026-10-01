import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly adminEmail: string;
  private readonly gmailUser: string;
  private readonly platformName: string;

  constructor(private readonly config: ConfigService) {
    this.gmailUser = this.config.getOrThrow<string>('GMAIL_USER');
    this.platformName = this.config.get<string>('PLATFORM_NAME', 'Training Platform');
    this.adminEmail = this.config.getOrThrow<string>('ADMIN_NOTIFICATION_EMAIL');

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.gmailUser,
        // This must be a Gmail App Password (Google Account -> Security ->
        // App Passwords), not your normal Gmail login password — Gmail
        // blocks plain-password SMTP logins from apps.
        pass: this.config.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async notifyAdminOfPaymentSubmission(params: {
    payerEmail: string;
    courseTitle: string;
    amountPaid: number;
    payerAccountName: string;
    submissionId: string;
  }) {
    try {
      await this.transporter.sendMail({
        // From shows the platform's Gmail address; replying goes straight
        // to the user who submitted the claim.
        from: `"${this.platformName}" <${this.gmailUser}>`,
        replyTo: params.payerEmail,
        to: this.adminEmail,
        subject: `New payment claim — ${params.courseTitle}`,
        text:
          `${params.payerEmail} (account name: "${params.payerAccountName}") claims to have paid ` +
          `${params.amountPaid} for "${params.courseTitle}".\n\n` +
          `Review it: submission ID ${params.submissionId}.`,
      });
    } catch (err) {
      // Don't fail the user's request just because the email didn't send —
      // the submission is already saved and visible in the admin queue.
      this.logger.error('Failed to send payment notification email', err);
    }
  }
}
