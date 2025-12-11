import { IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RolloverApiKeyDto {
  @ApiProperty({
    example: '41458da0-4b43-4661-9a57-85ceb53482d6',
    description: 'UUID of the expired API key',
  })
  @IsUUID('4', { message: 'Invalid expired_key_id format' })
  expired_key_id: string;

  @ApiProperty({
    example: '1M',
    description: 'New expiry duration',
    enum: ['1H', '1D', '1M', '1Y'],
  })
  @IsString()
  @IsEnum(['1H', '1D', '1M', '1Y'], {
    message: 'Expiry must be one of: 1H, 1D, 1M, 1Y',
  })
  expiry: '1H' | '1D' | '1M' | '1Y';
}