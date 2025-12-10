import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.APP_PORT,) || 3000,
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
}));