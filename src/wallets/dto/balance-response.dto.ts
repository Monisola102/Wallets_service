import { ApiProperty } from '@nestjs/swagger';

export class BalanceResponseDto {
  @ApiProperty({ example: 15000, description: 'Wallet balance in Naira' })
  balance: number;
}