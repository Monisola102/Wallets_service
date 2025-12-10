import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Transaction } from '@prisma/client';
import { TransactionStatus,TransactionType } from 'generated/prisma/enums';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}
  async createTransaction(
    walletId: string,
    type: TransactionType,
    amount: number,
    reference: string,
    recipientWalletId?: string,
  ): Promise<Transaction> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return await this.prisma.transaction.create({
      data: {
        walletId,
        userId: wallet.userId,
        type,
        amount,
        reference,
        status: TransactionStatus.PENDING,
        ...(recipientWalletId && { meta: { recipientWalletId } as Prisma.InputJsonValue }),
      },
    });
  }
  async updateTransactionStatus(
    reference: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return await this.prisma.transaction.update({
      where: { reference },
      data: { status },
    });
  }
  async getTransactionsByWalletId(walletId: string): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findByReference(reference: string): Promise<Transaction | null> {
    return await this.prisma.transaction.findUnique({
      where: { reference },
    });
  }
}
