import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateQuestionDto } from './dto/update-question.dto';

const PASS_THRESHOLD = 0.7; // 70% correct to pass

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async addQuestion(courseId: string, dto: CreateQuestionDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.question.create({
      data: {
        courseId,
        text: dto.text,
        order: dto.order ?? 0,
        options: { create: dto.options },
      },
      include: { options: true },
    });
  }

  async removeQuestion(courseId: string, questionId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question || question.courseId !== courseId) {
      throw new NotFoundException('Question not found for this course');
    }
    return this.prisma.question.delete({ where: { id: questionId } });
  }

  // Admin preview — includes which option is correct.
  listQuestionsForAdmin(courseId: string) {
    return this.prisma.question.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { options: true },
    });
  }

  // Gated the same way content is: must be enrolled and paid.
  // isCorrect is stripped so the client can't just read the answer key.
  async listQuestionsForUser(courseId: string, userId: string) {
    await this.assertPaidAccess(courseId, userId);

    const questions = await this.prisma.question.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { options: { select: { id: true, text: true } } },
    });
    return questions;
  }

  async submit(courseId: string, userId: string, dto: SubmitAssessmentDto) {
    await this.assertPaidAccess(courseId, userId);

    const questions = await this.prisma.question.findMany({
      where: { courseId },
      include: { options: true },
    });
    if (questions.length === 0) {
      throw new BadRequestException('This course has no assessment configured');
    }

    const answerMap = new Map(dto.answers.map((a) => [a.questionId, a.selectedOptionId]));

    let correctCount = 0;
    for (const question of questions) {
      const selectedOptionId = answerMap.get(question.id);
      const correctOption = question.options.find((o) => o.isCorrect);
      if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = correctCount / questions.length >= PASS_THRESHOLD;

    return this.prisma.assessmentSubmission.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, score, passed },
      update: { score, passed, submittedAt: new Date() },
    });
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

  async updateQuestion(
    courseId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });

    if (!question || question.courseId !== courseId) {
      throw new NotFoundException('Question not found for this course');
    }

    // Make sure any supplied option actually belongs to this question
    if (dto.options) {
      for (const option of dto.options) {
        const existingOption = question.options.find(
          (o) => o.id === option.id,
        );

        if (!existingOption) {
          throw new NotFoundException(
            `Option ${option.id} not found for this question`,
          );
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update question fields
      await tx.question.update({
        where: { id: questionId },
        data: {
          ...(dto.text !== undefined && { text: dto.text }),
          ...(dto.order !== undefined && { order: dto.order }),
        },
      });

      if (dto.options) {
        const answerChange = dto.options.find(
          (option) => option.isCorrect === true,
        );

        if (answerChange) {
          // Changing the correct answer:
          // first make every option incorrect
          await tx.option.updateMany({
            where: { questionId },
            data: { isCorrect: false },
          });

          // then make the selected option correct
          await tx.option.update({
            where: { id: answerChange.id },
            data: {
              ...(answerChange.text !== undefined && {
                text: answerChange.text,
              }),
              isCorrect: true,
            },
          });

          // Update text on any other supplied options
          for (const option of dto.options) {
            if (option.id === answerChange.id) continue;

            if (option.text !== undefined) {
              await tx.option.update({
                where: { id: option.id },
                data: { text: option.text },
              });
            }
          }
        } else {
          // Only option text is being changed
          for (const option of dto.options) {
            await tx.option.update({
              where: { id: option.id },
              data: {
                ...(option.text !== undefined && {
                  text: option.text,
                }),
              },
            });
          }
        }
      }

      return tx.question.findUnique({
        where: { id: questionId },
        include: { options: true },
      });
    });
  }
}
