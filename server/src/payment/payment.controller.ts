import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayLoad, type RequestWithJWT } from '../auth/types/auth-types';
import { PaymentService } from './payment.service';
import { SubmitPaymentDto } from './dto/submit-payment.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('courses/:courseId/payment/account-info')
  getAccountInfo(@Param('courseId') courseId: string) {
    return this.paymentService.getAccountInfo(courseId);
  }

  @Post('courses/:courseId/payment/submit')
  submitPayment(
    @Param('courseId') courseId: string,
    @Body() dto: SubmitPaymentDto,
    @Req() req: RequestWithJWT,
  ) {
    const user = req.user as JwtPayLoad;
    return this.paymentService.submitPayment(user.sub, user.email, courseId, dto);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Get('payments/pending')
  listPending() {
    return this.paymentService.listPending();
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch('payments/:submissionId/confirm')
  confirm(@Param('submissionId') submissionId: string, @Req() req: RequestWithJWT) {
    const reviewer = req.user as JwtPayLoad;
    return this.paymentService.confirm(submissionId, reviewer.sub);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch('payments/:submissionId/reject')
  reject(@Param('submissionId') submissionId: string, @Req() req: RequestWithJWT) {
    const reviewer = req.user as JwtPayLoad;
    return this.paymentService.reject(submissionId, reviewer.sub);
  }
}
