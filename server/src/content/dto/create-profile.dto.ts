import { IsBoolean, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsPhoneNumber() // set a default region in main.ts if numbers aren't E.164
  phone!: string;

  @IsBoolean()
  hasPreviousCertification!: boolean;

  // No certificate file here — that's a separate upload via
  // POST /users/certificate, since it needs multipart/form-data.
}
