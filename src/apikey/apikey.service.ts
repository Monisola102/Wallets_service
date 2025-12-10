import { Injectable, BadRequestException ,ForbiddenException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-apikey.dto';
import { RolloverApiKeyDto } from './dto/rollover-apikey.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApikeyService {
  constructor(private prisma: PrismaService) {}

  private convertExpiry(expiry: string) {
    const now = new Date();
    switch (expiry) {
      case '1H':
        now.setHours(now.getHours() + 1);
        break;
      case '1D':
        now.setDate(now.getDate() + 1);
        break;
      case '1M':
        now.setMonth(now.getMonth() + 1);
        break;
      case '1Y':
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        throw new BadRequestException('Invalid expiry');
    }
    return now;
  }

 async createApiKey(userId: string, dto: CreateApiKeyDto) {
  const count = await this.prisma.apiKey.count({
    where: { userId, revoked: false, expiresAt: { gt: new Date() } },
  });

  if (count >= 5) {
    throw new BadRequestException('Maximum 5 active API keys allowed');
  }
  const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = rawKey.slice(0, 12); 
  const hashedKey = crypto
    .createHash('sha256')
    .update(rawKey)
    .digest('hex');
  const expiresAt = this.convertExpiry(dto.expiry);
  const apiKey = await this.prisma.apiKey.create({
    data: {
      userId,
      prefix,
      hashedKey,
      name: dto.name,
      permissions: dto.permissions,
      expiresAt,
    },
  });
  return {
    api_key: rawKey,
    expires_at: apiKey.expiresAt,
  };
}

async rolloverApiKey(userId: string, dto: RolloverApiKeyDto) {
  const oldKey = await this.prisma.apiKey.findUnique({
    where: { id: dto.expired_key_id },
  });
  console.log('Fetched old API key:', oldKey);
  if (!oldKey) {
    console.log('API key not found');
    throw new BadRequestException('API key not found');
  }
  console.log('JWT userId:', userId, 'API Key userId:', oldKey.userId);
  if (oldKey.userId !== userId) {
    console.log('User does not own this key');
    throw new ForbiddenException('This key does not belong to you');
  }
  console.log('Old key expiry:', oldKey.expiresAt, 'Now:', new Date());
  if (oldKey.expiresAt > new Date()) {
    console.log('Key not yet expired');
    throw new BadRequestException('Key not yet expired');
  }
  console.log('Creating new API key with permissions:', oldKey.permissions, 'and expiry:', dto.expiry);
  const newKey = await this.createApiKey(userId, {
    name: oldKey.name,
    permissions: oldKey.permissions,
    expiry: dto.expiry,
  });
  console.log('New API key created:', newKey);
  return newKey;
}  
}
