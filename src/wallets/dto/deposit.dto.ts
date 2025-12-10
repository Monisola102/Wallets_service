import { IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    example: 5000,
    description: 'Amount to deposit in Naira (minimum 100)',
    minimum: 100,
  })
  @IsNumber()
  @IsPositive({ message: 'Amount must be a positive number' })
  @Min(100, { message: 'Minimum deposit amount is 100' })
  amount: number;
}