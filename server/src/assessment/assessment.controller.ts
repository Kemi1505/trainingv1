import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayLoad, type RequestWithJWT } from '../auth/types/auth-types';
import { AssessmentService } from './assessment.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('courses/:courseId/assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Post('questions')
  addQuestion(
    @Param('courseId') courseId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.assessmentService.addQuestion(courseId, dto);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Delete('questions/:questionId')
  removeQuestion(
    @Param('courseId') courseId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.assessmentService.removeQuestion(courseId, questionId);
  }

  @Get('questions')
  getQuestions(@Param('courseId') courseId: string, @Req() req: RequestWithJWT) {
    const user = req.user as JwtPayLoad;
    if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      return this.assessmentService.listQuestionsForAdmin(courseId);
    }
    return this.assessmentService.listQuestionsForUser(courseId, user.sub);
  }

  @Post('submit')
  submit(
    @Param('courseId') courseId: string,
    @Body() dto: SubmitAssessmentDto,
    @Req() req: RequestWithJWT,
  ) {
    const user = req.user as JwtPayLoad;
    return this.assessmentService.submit(courseId, user.sub, dto);
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch('questions/:questionId')
  updateQuestion(
    @Param('courseId') courseId: string, 
    @Param('questionId') questionId: string, 
    @Body() dto: UpdateQuestionDto) {
    return this.assessmentService.updateQuestion(courseId, questionId, dto);
  }
}
