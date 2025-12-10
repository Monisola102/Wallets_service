import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from '../utils/GoogleStrategy';
import { PrismaModule } from '@/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from '../utils/JwtStrategy';
import googleOauthConfig from '../config/google-oauth.config';
import { UserService } from '@/user/user.service';
import { Localstrategy } from '../utils/localStrategy';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { RefreshJwtStrategy } from '../utils/refreshStrategy';
import { AuthGuardsModule } from '@/guards/auth-guards.module';
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    ConfigModule.forFeature(googleOauthConfig),
    AuthGuardsModule
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService,GoogleStrategy, JwtStrategy,Localstrategy,RefreshJwtStrategy],
 exports: [AuthGuardsModule]

})
export class AuthModule {}
