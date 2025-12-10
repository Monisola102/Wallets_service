import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }
    const prefix = apiKey.slice(0, 12);

    const key = await this.prisma.apiKey.findFirst({
      where: { prefix },
      include: { user: true },
    });

    if (!key) {
      throw new ForbiddenException('Invalid API key');
    }
    const hashedIncoming = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    if (hashedIncoming !== key.hashedKey) {
      throw new ForbiddenException('Invalid API key signature');
    }

    if (key.revoked || key.expiresAt < new Date()) {
      throw new ForbiddenException('API key expired or revoked');
    }
    request.user = { id: key.userId, apiKey: true };

    return true;
  }
}
