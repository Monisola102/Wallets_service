import { 
  Controller, Post, Body, Get, Query, Req, Res, Headers, HttpCode, HttpStatus, BadRequestException, UseGuards 
} from '@nestjs/common';
import {Response, Request} from 'express';
import { WalletsService } from './wallets.service';
import { InitializeTransactionDto } from './dto/initialize-transaction.dto';
import { PayStackCallbackDto } from './dto/paystack-callback.dto';
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
import { JwtAuthGuard } from '@/auth/utils/jwt-auth.guard';
import { ApiKeyGuardFactory} from '@/auth/utils/Apikey.guard';

interface RawRequest extends Request {
  rawBody: string;
}

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
  async webhook(@Req() req: RawRequest, @Res() res: Response) {
    const signature = (req.headers['x-paystack-signature'] as string) || '';

    try {
      await this.walletService.handlePaystackWebhook(req.rawBody, signature);
      return res.status(200).json({ status: true });
    } catch (err) {
      console.error('Webhook processing error:', err.message);
      return res.status(400).json({ status: false });
    }
  }
}
 

