import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { AssessmentModule } from './assessment/assessment.module';
import { ContentModule } from './content/content.module';
import { CourseModule } from './course/course.module';
import { PaymentModule } from './payment/payment.module';
import { UserModule } from './user/user.module';
import { MailModule } from './common/mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule, PrismaModule, AdminModule, 
    AssessmentModule, ContentModule, CourseModule, 
    PaymentModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
