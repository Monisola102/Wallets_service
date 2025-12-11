import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { 
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });
    let validKey = null;
    for (const key of apiKeys) {
      const isValid = await bcrypt.compare(apiKey, key.hashedKey);
      if (isValid) {
        validKey = key;
        break;
      }
    }

    if (!validKey) {
      throw new ForbiddenException('Invalid API key');
    }
    request.user = { 
      userId: validKey.userId,
      email: validKey.user?.email,
      sub: validKey.userId,
      apiKey: true,
      permissions: validKey.permissions
    };

    return true;
  }
}