import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiKeyService } from './apikey.service';
import { CreateApiKeyDto } from './dto/create-apikey.dto';
import { RolloverApiKeyDto } from './dto/rollover-apikey.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { JwtAuthGuard } from '@/utils/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PayloadType } from 'src/interface/payload-types';

@ApiTags('API Keys')
@Controller('keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

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
  async create(
    @CurrentUser() user: PayloadType,
    @Body() dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeyService.create(user.userId, dto);
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
  async rollover(
    @CurrentUser() user: PayloadType,
    @Body() dto: RolloverApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeyService.rollover(user.userId, dto);
  }

  @Delete(':keyId/revoke')
  @ApiOperation({
    summary: 'Revoke API key',
    description: 'Permanently disable an API key. Cannot be undone.',
  })
  @ApiParam({ name: 'keyId', description: 'UUID of the API key to revoke' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async revoke(
    @CurrentUser() user: PayloadType,
    @Param('keyId') keyId: string,
  ): Promise<{ message: string }> {
    await this.apiKeyService.revoke(user.userId, keyId);
    return { message: 'API key revoked successfully' };
  }
}