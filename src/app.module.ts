import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { WalletsModule } from './wallets/wallets.module';
import { ApikeyModule } from './apikey/apikey.module';
import { PaystackModule } from './paystack/paystack.module';
import { TransactionModule } from './transaction/transaction.module';
import jwtConfig from './config/jwt.config';
import paystackConfig from './config/paystack.config';
import refreshJwtConfig from './config/refresh-jwt.config';
import googleOauthConfig from './config/google-oauth.config';
import appConfig from './config/app.config';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        jwtConfig,
        refreshJwtConfig,
        googleOauthConfig,
        paystackConfig,
        appConfig,
      ],
 // ← makes ConfigService available everywhere
    }), AuthModule,PrismaModule, UserModule, WalletsModule, ApikeyModule, PaystackModule, TransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
