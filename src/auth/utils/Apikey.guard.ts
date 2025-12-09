import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Type } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export function ApiKeyGuardFactory(permission: string): Type<CanActivate> {
  @Injectable()
  class ApiKeyGuard implements CanActivate {
    constructor(private prisma: PrismaService) {} // ONLY PrismaService

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const apiKey = request.headers['x-api-key'];

      if (!apiKey) return false;

      const key = await this.prisma.apiKey.findUnique({ where: { hashedKey: apiKey } });

      if (!key || key.revoked || key.expiresAt < new Date()) {
        throw new ForbiddenException('Invalid or expired API key');
      }

      if (!key.permissions.includes(permission)) {
        throw new ForbiddenException('Insufficient API key permissions');
      }

      request.user = { id: key.userId, apiKey: true };
      return true;
    }
  }

  return ApiKeyGuard;
}
