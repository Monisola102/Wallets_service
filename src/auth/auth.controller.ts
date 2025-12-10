import {
  Controller,
  Get,
  Request,
  Response,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoogleAuthGuard } from './utils/Guards';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LocalAuthGuard } from './utils/local-auth.guard';
import { RefreshAuthGuard } from './utils/refresh-auth.guard';

@ApiTags('Google Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly jwtService:JwtService) {}
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

@Post('refresh')
refreshToken(@Request() req: any) {
  const payload = { sub: req.user.id, email: req.user.email };
  const accessToken = this.jwtService.sign(payload); 
  return { access_token: accessToken };
}

  @Get('google/login')
  @ApiOperation({ summary: 'Redirect user to Google for login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth screen' })
  @UseGuards(GoogleAuthGuard)
  handleLogin() {}

  @Get('google/callback')
@ApiOperation({ summary: 'Google OAuth callback URL' })
@ApiResponse({ status: 200, description: 'Google authentication successful' })
@UseGuards(GoogleAuthGuard)
async handleRedirect(@Request() req: any) {
  const loginResponse = await this.authService.login(req.user);
  return {
    token: loginResponse.access_token,
    user: req.user,
  };
}

 
}
