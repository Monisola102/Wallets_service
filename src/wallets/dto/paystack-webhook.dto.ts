import { IsObject } from 'class-validator';

export class PaystackWebhookDto {
  @IsObject()
  event: any;
  @IsObject()
  data: any;
}
