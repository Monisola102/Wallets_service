
import { IsString, IsNotEmpty } from 'class-validator';

export class PayStackCallbackDto {
  @IsString()
  @IsNotEmpty()
  reference: string;
}
