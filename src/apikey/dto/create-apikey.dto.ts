import { IsString, IsArray, ArrayNotEmpty, IsIn } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name: string; // Friendly name for the API key

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['deposit', 'transfer', 'read'], { each: true })
  permissions: string[]; // Must contain valid permissions only

  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: '1H' | '1D' | '1M' | '1Y'; // Expiry period
}
