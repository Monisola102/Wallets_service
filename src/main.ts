import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    bodyParser.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const config = new DocumentBuilder()
    .setTitle('Wallet Service API')
    .setDescription('API documentation for Wallet Service with Paystack, JWT & API Keys')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') || 3000;

  await app.listen(port);
  console.log(`Wallet Service listening on http://localhost:${port}`);
}
bootstrap();
