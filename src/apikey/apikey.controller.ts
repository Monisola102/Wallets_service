import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApikeyService } from './apikey.service';
import { CreateApiKeyDto } from './dto/create-apikey.dto';
import { RolloverApiKeyDto } from './dto/rollover-apikey.dto';
import { JwtAuthGuard } from '@/utils/jwt-auth.guard';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('keys')
export class ApikeyController {
  constructor(private apikeyService: ApikeyService) {}
  @Post('create')
  @ApiOperation({
    summary: 'Create new API key',
    description:
      'Generate a new API key with specified permissions. Maximum 5 active keys per user.',
  })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiResponse({ status: 403, description: 'Maximum 5 active keys reached' })
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() dto: CreateApiKeyDto) {
    console.log('User from JWT:', req.user);
    return this.apikeyService.createApiKey(req.user.id, dto);
  }

  @Post('rollover')
  @ApiOperation({
    summary: 'Rollover expired API key',
    description:
      'Create a new API key with the same permissions as an expired one.',
  })
  @ApiResponse({
    status: 201,
    description: 'New API key created successfully',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Key not expired or invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiResponse({ status: 404, description: 'Expired key not found' })
  @UseGuards(JwtAuthGuard)
  async rollover(@Req() req: any, @Body() dto: RolloverApiKeyDto) {
    return this.apikeyService.rolloverApiKey(req.user.id, dto);
  }
}
