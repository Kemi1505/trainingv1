import { IsNumber, IsString, Min } from 'class-validator';

export class SubmitPaymentDto {
  @IsNumber()
  @Min(0)
  amountPaid!: number;

  @IsString()
  payerAccountName!: string;
}
