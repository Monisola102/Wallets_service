import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Wallet Service API')
    .setDescription(
      'A backend wallet service with Paystack integration, supporting deposits, transfers, and API key authentication.',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'Google OAuth and JWT token generation')
    .addTag(
      'Wallet',
      'Wallet operations (balance, deposit, transfer, transactions)',
    )
    .addTag('API Keys', 'API key management (create, rollover, revoke)')
    .addTag('Webhooks', 'Paystack webhook handlers (internal use)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token from Google OAuth login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API Key for service-to-service authentication',
      },
      'API-Key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.APP_PORT || 3000;

  await app.listen(port);

  logger.log(`Wallet Service running on http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('Unhandled error in bootstrap:', error);

  process.exit(1);
});