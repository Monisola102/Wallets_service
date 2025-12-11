import {
  IsString,
  IsArray,
  IsEnum,
  ArrayNotEmpty,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyPermission } from '@/types/api-key-permission';

export class CreateApiKeyDto {
  @ApiProperty({
    example: 'wallet-service',
    description: 'Descriptive name for the API key',
  })
  @IsString()
  @Length(3, 100, { message: 'Name must be between 3 and 100 characters' })
  name: string;

  @ApiProperty({
    example: ['deposit', 'transfer', 'read'],
    description: 'Array of permissions',
    enum: ApiKeyPermission,
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Permissions array cannot be empty' })
  @IsEnum(ApiKeyPermission, { each: true, message: 'Invalid permission value' })
  permissions: ApiKeyPermission[];

  @ApiProperty({
    example: '1D',
    description: 'Expiry duration: 1H (hour), 1D (day), 1M (month), 1Y (year)',
    enum: ['1H', '1D', '1M', '1Y'],
  })
  @IsString()
  @IsEnum(['1H', '1D', '1M', '1Y'], {
    message: 'Expiry must be one of: 1H, 1D, 1M, 1Y',
  })
  expiry: '1H' | '1D' | '1M' | '1Y';
}