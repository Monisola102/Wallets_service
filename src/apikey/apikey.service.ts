import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateApiKeyDto } from './dto/create-apikey.dto';
import { RolloverApiKeyDto } from './dto/rollover-apikey.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    const activeKeysCount = await this.prisma.apiKey.count({
      where: { userId, revoked: false },
    });

    if (activeKeysCount >= 5) {
      throw new ForbiddenException(
        'Maximum 5 active API keys allowed per user.',
      );
    }

    const rawKey = this.generateApiKey();
    const hashedKey = await bcrypt.hash(rawKey, 10);
    const expiresAt = this.calculateExpiry(dto.expiry);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        prefix: rawKey.substring(0, 8),
        hashedKey,
        permissions: dto.permissions,
        expiresAt,
        revoked: false,
      },
    });

    return {
      api_key: rawKey,
      expires_at: expiresAt,
    };
  }

  async rollover(
    userId: string,
    dto: RolloverApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    const expiredKey = await this.prisma.apiKey.findUnique({
      where: { id: dto.expired_key_id },
    });

    if (!expiredKey || expiredKey.userId !== userId) {
      throw new NotFoundException('API key not found.');
    }

    const now = new Date();
    if (expiredKey.expiresAt > now) {
      throw new BadRequestException('API key is not expired yet.');
    }

    const activeKeysCount = await this.prisma.apiKey.count({
      where: { userId, revoked: false },
    });

    if (activeKeysCount >= 5) {
      throw new ForbiddenException(
        'Maximum 5 active API keys allowed. Revoke one first.',
      );
    }

    const rawKey = this.generateApiKey();
    const hashedKey = await bcrypt.hash(rawKey, 10);
    const expiresAt = this.calculateExpiry(dto.expiry);

    const newApiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: expiredKey.name,
        prefix: rawKey.substring(0, 8),
        hashedKey,
        permissions: expiredKey.permissions,
        expiresAt,
        revoked: false,
      },
    });

    return {
      api_key: rawKey,
      expires_at: expiresAt,
    };
  }

  async revoke(userId: string, keyId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey || apiKey.userId !== userId) {
      throw new NotFoundException('API key not found.');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revoked: true },
    });
  }

  async validateApiKey(rawKey: string): Promise<any> {
    // Find all non-revoked keys
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { 
        revoked: false,
        expiresAt: { gt: new Date() }
      },
    });

    // Check each key's hash
    for (const key of apiKeys) {
      const isValid = await bcrypt.compare(rawKey, key.hashedKey);
      if (isValid) {
        return key;
      }
    }

    return null;
  }

  private generateApiKey(): string {
    const randomBytes = crypto.randomBytes(32);
    return `sk_live_${randomBytes.toString('hex')}`;
  }

  private calculateExpiry(expiry: '1H' | '1D' | '1M' | '1Y'): Date {
    const now = new Date();
    switch (expiry) {
      case '1H':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '1D':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1M':
        return new Date(now.setMonth(now.getMonth() + 1));
      case '1Y':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        throw new BadRequestException('Invalid expiry format');
    }
  }
}