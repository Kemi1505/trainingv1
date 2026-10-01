import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CourseDifficulty } from '../course-difficulty.enum';


// Sent as multipart/form-data (picture is a file on the "picture" field) —
// every other field arrives as a string, hence the @Type/@Transform below.
export class CreateCourseDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(CourseDifficulty)
  difficulty?: CourseDifficulty;

  // Sent from the client as a JSON-stringified array, e.g.
  // '["Rig a basic load","Read a lift plan"]' — multipart fields are
  // always strings, so this has to be parsed rather than validated as-is.
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })
  @IsString({ each: true })
  learningOutcomes?: string[];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  requiresPreviousCertification?: boolean;
}
