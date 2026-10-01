import {
  IsBoolean,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsPhoneNumber() // set a default region in main.ts if numbers aren't E.164
  phone!: string;

  @IsBoolean()
  hasPreviousCertification!: boolean;

}
