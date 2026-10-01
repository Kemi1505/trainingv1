import { IsIn } from 'class-validator';

export class ReviewCertificationDto {
  @IsIn(['VERIFIED', 'REJECTED'])
  decision!: 'VERIFIED' | 'REJECTED';
}
