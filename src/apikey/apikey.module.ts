import { Module } from '@nestjs/common';
import { ApikeyService } from './apikey.service';
import { ApikeyController } from './apikey.controller';

@Module({
  providers: [ApikeyService],
  controllers: [ApikeyController]
})
export class ApikeyModule {}
