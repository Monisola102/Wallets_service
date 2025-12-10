import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { InitializeTransactionDto } from './dto/initialize-transaction.dto';
import { PayStackCallbackDto } from './dto/paystack-callback.dto';
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
import * as crypto from 'crypto';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}
  async initializeDeposit(dto: InitializeTransactionDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const amountInKobo = dto.amount * 100;

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount: amountInKobo,
        callback_url: process.env.PAYSTACK_CALLBACK_URL,
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
      },
    );
    const init = response.data.data;

    return {
      reference: init.reference,
      authorization_url: init.authorization_url,
    };
  }
  async verifyTransaction(query: PayStackCallbackDto) {
    const { reference } = query;
    let existingTx = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!existingTx) {
      const paystackRes = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } },
      );

      const { status, amount, customer } = paystackRes.data.data;

      if (status !== 'success')
        throw new BadRequestException('Payment not successful');
      let user = await this.prisma.user.findUnique({
        where: { email: customer.email },
      });
      if (!user) {
        const fullName = customer.name || 'Test User';
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || ' ';

        user = await this.prisma.user.create({
          data: {
            email: customer.email,
            firstName,
            lastName,
          },
        });
      }
      let wallet = await this.prisma.wallet.findUnique({
        where: { userId: user.id },
      });
      if (!wallet) {
        wallet = await this.prisma.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            walletNumber: this.generateWalletNumber(),
          },
        });
      }
      wallet = await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount / 100 } },
      });
      existingTx = await this.prisma.transaction.create({
        data: {
          userId: user.id,
          walletId: wallet.id,
          amount: amount / 100,
          type: 'deposit',
          status: 'success',
          reference,
        },
      });
    }
    return existingTx;
  }

   async handlePaystackWebhook(rawBody: string, signature: string) {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET!)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.log('Invalid Paystack signature');
      throw new BadRequestException('Invalid signature');
    }

    const dto: PaystackWebhookDto = JSON.parse(rawBody);
    const event = dto.event;
    const data = dto.data;

    console.log('Webhook event:', event);
    console.log('Webhook data:', data);
    if (event !== 'charge.success') {
      console.log('Ignoring event:', event);
      return;
    }

    const reference = data.reference;
    const existingTx = await this.prisma.transaction.findUnique({
      where: { reference },
    });
    if (existingTx) {
      console.log('Transaction already processed:', reference);
      return;
    }

    const amount = data.amount; 
    const userId = data.customer.id;
    await this.prisma.$transaction(async (prisma) => {
      let wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            balance: 0,
            walletNumber: this.generateWalletNumber(),
          },
        });
        console.log('Created new wallet for user:', userId);
      }

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount / 100 } },
      });
      console.log(`Wallet credited for user ${userId}: ${amount / 100}`);

      await prisma.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount: amount / 100,
          type: 'deposit',
          status: 'success',
          reference,
        },
      });
      console.log('Transaction logged:', reference);
    });
  }

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    return { balance: wallet?.balance || 0 };
  }
  async transfer(
    userId: string,
    dto: { walletNumber: string; amount: number },
  ) {
    const senderWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!senderWallet) throw new NotFoundException('Sender wallet not found');
    if (senderWallet.balance < dto.amount)
      throw new BadRequestException('Insufficient balance');

    const recipientWallet = await this.prisma.wallet.findUnique({
      where: { walletNumber: dto.walletNumber },
    });
    if (!recipientWallet)
      throw new NotFoundException('Recipient wallet not found');

    return await this.prisma.$transaction(async (prisma) => {
      await prisma.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: dto.amount } },
      });

      await prisma.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: { increment: dto.amount } },
      });

      return await prisma.transaction.create({
        data: {
          userId,
          walletId: senderWallet.id,
          amount: dto.amount,
          type: 'transfer',
          status: 'success',
          reference: `transfer_${Date.now()}`,
        },
      });
    });
  }
  async history(userId: string) {
    return await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
  private generateWalletNumber(): string {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  }
}
