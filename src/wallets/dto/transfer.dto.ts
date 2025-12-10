import { IsString, IsNumber, IsPositive, Length, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    example: '4566678954356',
    description: "Recipient's 13-digit wallet number",
    minLength: 13,
    maxLength: 13,
  })
  @IsString()
  @Length(13, 13, { message: 'Wallet number must be exactly 13 digits' })
  wallet_number: string;

  @ApiProperty({
    example: 1000,
    description: 'Amount to transfer in Naira (minimum 100)',
    minimum: 100,
  })
  @IsNumber()
  @IsPositive({ message: 'Amount must be a positive number' })
  @Min(100, { message: 'Minimum transfer amount is 100' })
  amount: number;
}