import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({
    example: {
      id: '41458da0-4b43-4661-9a57-85ceb53482d6',
      email: 'user@example.com',
      wallet_number: '4566678954356',
    },
  })
  user: {
    id: string;
    email: string;
    wallet_number: string | null;
  };
}