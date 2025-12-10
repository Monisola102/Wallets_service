import { ApiProperty } from '@nestjs/swagger';

export class DepositResponseDto {
  @ApiProperty({ example: 'dep_1765327886986_b58962b0' })
  reference: string;

  @ApiProperty({ example: 'https://checkout.paystack.com/xyz123' })
  authorization_url: string;
}