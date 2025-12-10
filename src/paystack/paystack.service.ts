import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHmac } from 'crypto';
import {
  PaystackInitializeResponse,
  PaystackVerifyResponse,
} from 'src/interface/paystack-types';

@Injectable()
export class PaystackService {
  private readonly secretKey: string;
  private readonly baseURL: string;
  private readonly callbackUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.secretKey = this.configService.get<string>('paystack.secretKey')!;
    this.baseURL = this.configService.get<string>('paystack.url')!;
    this.callbackUrl = this.configService.get<string>('paystack.callbackUrl')!;
  }

  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
  ): Promise<{ authorization_url: string; reference: string }> {
    try {
      const response$ = this.httpService.post<PaystackInitializeResponse>(
        `${this.baseURL}/transaction/initialize`,
        {
          email,
          amount: amount * 100,
          reference,
          callback_url: `${this.callbackUrl}?reference=${reference}`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const response = await firstValueFrom(response$);

      if (!response.data.status) {
        throw new BadRequestException('Failed to initialize payment');
      }

      return {
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(errMsg || 'Payment initialization failed');
    }
  }

  async verifyTransaction(reference: string): Promise<{
    status: 'success' | 'failed' | 'abandoned';
    amount: number;
    paidAt: string;
  }> {
    try {
      const response$ = this.httpService.get<PaystackVerifyResponse>(
        `${this.baseURL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const response = await firstValueFrom(response$);

      if (!response.data.status) {
        throw new BadRequestException('Transaction verification failed');
      }

      return {
        status: response.data.data.status as 'success' | 'failed' | 'abandoned',
        amount: response.data.data.amount / 100, // Convert from kobo
        paidAt: response.data.data.paid_at,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        errMsg || 'Transaction verification failed',
      );
    }
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    const hash = createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }
}
