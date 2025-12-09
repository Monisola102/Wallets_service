import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export default registerAs('jwtAccess', (): JwtModuleOptions => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined in .env');
  }

  const expiresIn: any = process.env.JWT_EXPIRE_IN || '1h'; // access token short-lived

  return {
    secret,
    signOptions: { expiresIn },
  } as JwtModuleOptions;
});
