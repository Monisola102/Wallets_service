import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApikeyService } from './apikey.service';
import { CreateApiKeyDto } from './dto/create-apikey.dto';
import { RolloverApiKeyDto } from './dto/rollover-apikey.dto';
import { JwtAuthGuard } from '@/auth/utils/jwt-auth.guard';

@Controller('keys')
export class ApikeyController {
  constructor(private apikeyService: ApikeyService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(@Req() req:any, @Body() dto: CreateApiKeyDto) {
    return this.apikeyService.createApiKey(req.user.sub, dto);
  }

  @Post('rollover')
  @UseGuards(JwtAuthGuard)
  async rollover(@Req() req:any, @Body() dto: RolloverApiKeyDto) {
    return this.apikeyService.rolloverApiKey(req.user.sub, dto);
  }
}
