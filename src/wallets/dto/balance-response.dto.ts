import { ApiProperty } from '@nestjs/swagger';

export class BalanceResponseDto {
  @ApiProperty({ example: 15000, description: 'Wallet balance in Naira' })
  balance: number;

  @ApiProperty({ 
    example: '1234567890123', 
    description: 'Your 13-digit wallet number' 
  })
  walletNumber: string;
}