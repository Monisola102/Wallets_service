import { registerAs } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';

export default registerAs('refresh-jwt', (): JwtSignOptions => {
  const secret = process.env.REFRESH_JWT_SECRET;
  if (!secret) {
    throw new Error('REFRESH_JWT_SECRET is not defined in .env');
  }

  // Force-cast expiresIn as string to satisfy TS
  const expiresIn: any = process.env.REFRESH_JWT_EXPIRE_IN || '7d';

  return {
    secret,
    expiresIn,
  } as JwtSignOptions;
});
