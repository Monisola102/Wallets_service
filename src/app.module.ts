import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { WalletsModule } from './wallets/wallets.module';
import { ApikeyModule } from './apikey/apikey.module';
@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true, // ← makes ConfigService available everywhere
    }), AuthModule,PrismaModule, UserModule, WalletsModule, ApikeyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
