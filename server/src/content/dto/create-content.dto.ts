import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Sent as multipart/form-data alongside the PDF file — form fields
// arrive as strings, hence @Type(() => Number) on order.
export class CreateContentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
