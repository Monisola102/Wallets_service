import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus,TransactionType } from 'generated/prisma/enums';

export class TransactionResponseDto {
  @ApiProperty({ enum: TransactionType, example: 'deposit' })
  type: TransactionType;

  @ApiProperty({ example: 5000 })
  amount: number;

  @ApiProperty({ enum: TransactionStatus, example: 'success' })
  status: TransactionStatus;
}