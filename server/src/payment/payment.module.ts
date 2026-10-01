import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MailModule } from '../common/mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
