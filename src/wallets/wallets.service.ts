import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionService } from '../transaction/transaction.service';
import { Wallet } from 'generated/prisma/client';
import { TransactionStatus, TransactionType } from 'generated/prisma/enums';
@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
  ) {}

  async createWallet(userId: string): Promise<Wallet> {
    const walletNumber = this.generateWalletNumber();

    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        walletNumber,
        balance: 0,
      },
    });

    return wallet;
  }

async getWalletByUserId(userId: string): Promise<Wallet> {
  let wallet = await this.prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await this.prisma.wallet.create({
      data: {
        userId,
        walletNumber: this.generateWalletNumber(),
        balance: 0,
      },
    });
  }

  return wallet;
}
  async getWalletByNumber(walletNumber: string): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { walletNumber },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async creditWallet(
    reference: string,
    amount: number,
    paystackStatus: string,
  ): Promise<void> {
    const transaction =
      await this.transactionService.findByReference(reference);

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      return;
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { id: transaction.walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (paystackStatus === 'success') {
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: Number(wallet.balance) + Number(amount),
        },
      });

      await this.transactionService.updateTransactionStatus(
        reference,
        TransactionStatus.SUCCESS,
      );
    } else {
      await this.transactionService.updateTransactionStatus(
        reference,
        TransactionStatus.FAILED,
      );
    }
  }

  async transfer(
    senderUserId: string,
    recipientWalletNumber: string,
    amount: number,
  ): Promise<{ status: string; message: string }> {
    try {
      const result = await this.prisma.$transaction(async (tx:any) => {
        // Find sender wallet
        const senderWallet = await tx.wallet.findUnique({
          where: { userId: senderUserId },
        });

        if (!senderWallet) {
          throw new NotFoundException('Sender wallet not found');
        }

        if (Number(senderWallet.balance) < amount) {
          throw new BadRequestException('Insufficient balance');
        }

        // Find recipient wallet
        const recipientWallet = await tx.wallet.findUnique({
          where: { walletNumber: recipientWalletNumber },
        });

        if (!recipientWallet) {
          throw new NotFoundException('Recipient wallet not found');
        }

        if (senderWallet.id === recipientWallet.id) {
          throw new BadRequestException('Cannot transfer to your own wallet');
        }

        // Deduct from sender
        await tx.wallet.update({
          where: { id: senderWallet.id },
          data: {
            balance: Number(senderWallet.balance) - amount,
          },
        });

        // Credit recipient
        await tx.wallet.update({
          where: { id: recipientWallet.id },
          data: {
            balance: Number(recipientWallet.balance) + amount,
          },
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            walletId: senderWallet.id,
            userId: senderUserId,
            type: TransactionType.TRANSFER,
            amount,
            status: TransactionStatus.SUCCESS,
            reference: this.generateReference(),
            meta: {
              recipientWalletId: recipientWallet.id,
              recipientWalletNumber: recipientWalletNumber,
            },
          },
        });

        return transaction;
      });

      return {
        status: 'success',
        message: 'Transfer completed',
      };
    } catch (error) {
      throw error;
    }
  }

  private generateWalletNumber(): string {
    return Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
  }

  private generateReference(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
