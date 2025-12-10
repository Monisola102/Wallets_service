import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty({ example: 'sk_live_abc123xyz...' })
  api_key: string;

  @ApiProperty({ example: '2025-12-11T01:05:58.000Z' })
  expires_at: Date;
}