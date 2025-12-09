import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto} from './dto/create-apikey.dto';
import { RolloverApiKeyDto } from './dto/rollover-apikey.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApikeyService {
  constructor(private prisma: PrismaService) {}

  private convertExpiry(expiry: string) {
    const now = new Date();
    switch (expiry) {
      case '1H': now.setHours(now.getHours() + 1); break;
      case '1D': now.setDate(now.getDate() + 1); break;
      case '1M': now.setMonth(now.getMonth() + 1); break;
      case '1Y': now.setFullYear(now.getFullYear() + 1); break;
      default: throw new BadRequestException('Invalid expiry');
    }
    return now;
  }

  async createApiKey(userId: string, dto: CreateApiKeyDto) {
  const count = await this.prisma.apiKey.count({
    where: { userId, revoked: false, expiresAt: { gt: new Date() } },
  });
  if (count >= 5) throw new BadRequestException('Maximum 5 active API keys allowed');

  const key = crypto.randomBytes(32).toString('hex');           // raw key
  const prefix = key.slice(0, 8);                                // optional
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex'); // hash for DB
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

  return { api_key: key, expires_at: apiKey.expiresAt };
}

  async rolloverApiKey(userId: string, dto: RolloverApiKeyDto) {
    const oldKey = await this.prisma.apiKey.findUnique({ where: { id: dto.expired_key_id } });
    if (!oldKey) throw new BadRequestException('API key not found');
    if (oldKey.userId !== userId) throw new BadRequestException('Not your key');
    if (oldKey.expiresAt > new Date()) throw new BadRequestException('Key not yet expired');

    return this.createApiKey(userId, { name: oldKey.name, permissions: oldKey.permissions, expiry: dto.expiry });
  }
}
