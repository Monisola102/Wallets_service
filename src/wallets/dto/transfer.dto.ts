import { IsUUID, IsNumber, IsPositive } from 'class-validator';

export class TransferDto {
  @IsUUID()
  receiverId: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
