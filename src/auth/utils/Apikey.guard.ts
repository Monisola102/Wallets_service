import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

export function ApiKeyGuardFactory(permission: string) {
  @Injectable()
  class ApiKeyGuard implements CanActivate {
    constructor(public prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const apiKey = request.headers['x-api-key'];

      if (!apiKey) {
        throw new UnauthorizedException('API key required');
      }
      const prefix = apiKey.slice(0, 12);
      const key = await this.prisma.apiKey.findFirst({
        where: { prefix },
      });

      if (!key) {
        throw new ForbiddenException('Invalid API key');
      }

      // 3. Hash incoming key
      const hashedIncoming = crypto
        .createHash('sha256')
        .update(apiKey)
        .digest('hex');

      // 4. Verify correct API key
      if (hashedIncoming !== key.hashedKey) {
        throw new ForbiddenException('Invalid API key signature');
      }

      // 5. Validate expiry & revocation
      if (key.revoked || key.expiresAt < new Date()) {
        throw new ForbiddenException('API key expired or revoked');
      }

      if (!key.permissions.includes(permission)) {
        throw new ForbiddenException(
          `API key missing permission: ${permission}`,
        );
      }
      request.user = { id: key.userId, apiKey: true };

      return true;
    }
  }

  return ApiKeyGuard;
}
