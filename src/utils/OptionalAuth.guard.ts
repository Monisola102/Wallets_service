import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './Apikey.guard';
import { RequestWithUser } from 'src/types/express-request-with-user';
import { firstValueFrom, isObservable } from 'rxjs';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Check which authentication method is being used
    const authHeader = request.headers.authorization;
    const hasJwt = authHeader?.startsWith('Bearer ');
    const hasApiKey = !!request.headers['x-api-key'];

    const resolveGuardResult = async (
      result: boolean | Promise<boolean> | import('rxjs').Observable<boolean>,
    ) => {
      if (isObservable(result)) {
        return await firstValueFrom(result);
      }
      return await Promise.resolve(result);
    };

    // If both are provided, prioritize JWT
    if (hasJwt) {
      try {
        const result = this.jwtAuthGuard.canActivate(context);
        // Handle both sync and async returns from canActivate
        return await resolveGuardResult(result);
      } catch (error) {
        // JWT validation failed
        throw new UnauthorizedException('Invalid or expired JWT token.');
      }
    }
    if (hasApiKey) {
      return await this.apiKeyGuard.canActivate(context);
    }
    throw new UnauthorizedException(
      'Authentication required. Provide either JWT token (Authorization: Bearer <token>) or API key (x-api-key header).',
    );
  }
}