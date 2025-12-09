import { 
  Controller, Post, Body, Get, Query, Req, Headers, HttpCode, HttpStatus, BadRequestException, UseGuards 
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { InitializeTransactionDto } from './dto/initialize-transaction.dto';
import { PayStackCallbackDto } from './dto/paystack-callback.dto';
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
import { JwtAuthGuard } from '@/auth/utils/jwt-auth.guard';
import { ApiKeyGuardFactory} from '@/auth/utils/Apikey.guard';

@Controller('wallets')
export class WalletsController {
  constructor(private walletService: WalletsService) {}
  @Post('deposit')
  @UseGuards(JwtAuthGuard, ApiKeyGuardFactory)
  async initializeDeposit(@Body() dto: InitializeTransactionDto, @Req() req:any) {
    const userId = req.user?.id || req.apiKey?.userId;
    return await this.walletService.initializeDeposit(dto, userId);
  }
@Get('callback')
async verifyTransaction(@Query() query: PayStackCallbackDto) {
  return await this.walletService.verifyTransaction(query);
}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async paymentWebhookHandler(
    @Body() dto: PaystackWebhookDto,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const result = await this.walletService.handlePaystackWebhook(dto, signature);
    if (!result) {
      return { status: false };
    }

    return { status: true };
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard, ApiKeyGuardFactory)
  async getBalance(@Req() req:any) {
    const userId = req.user?.id || req.apiKey?.userId;
    return await this.walletService.getBalance(userId);
  }

  @Post('transfer')
  @UseGuards(JwtAuthGuard, ApiKeyGuardFactory)
  async transfer(@Body() dto: { walletNumber: string; amount: number }, @Req() req:any) {
    const userId = req.user?.id || req.apiKey?.userId;
    return await this.walletService.transfer(userId, dto);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, ApiKeyGuardFactory)
  async history(@Req() req:any) {
    const userId = req.user?.id || req.apiKey?.userId;
    return await this.walletService.history(userId);
  }
}
