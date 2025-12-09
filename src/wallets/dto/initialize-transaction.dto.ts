
import { IsNumber, IsNotEmpty } from 'class-validator';

export class InitializeTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
