import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  NotFoundException,
  forwardRef,
  Inject,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallets.service';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionType, TransactionStatus } from 'generated/prisma/enums';
import { PaystackService } from '../paystack/paystack.service';
import { TransferDto } from './dto/transfer.dto';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { TransferResponseDto } from './dto/transfer-response.dto';
import { DepositDto } from './dto/deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PayloadType } from 'src/interface/payload-types';
import { OptionalAuthGuard } from '@/utils/OptionalAuth.guard';
import { RequirePermissions } from '@/common/decorators/require-permisions.decorator';
import { ApiKeyPermission } from '@/types/api-key-permission';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionResponseDto } from '@/transaction/dto/transaction-response.dto';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
  ) {}

  @UseGuards(OptionalAuthGuard)
  @RequirePermissions(ApiKeyPermission.READ)
  @Get('balance')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({
    summary: 'Get wallet balance',
    description:
      'Retrieve current wallet balance. Requires JWT or API key with READ permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
    type: BalanceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getBalance(
    @CurrentUser() user: PayloadType,
  ): Promise<BalanceResponseDto> {
    const wallet = await this.walletService.getWalletByUserId(user.userId);

    return { balance: Number(wallet.balance) };
  }

  @UseGuards(OptionalAuthGuard)
  @RequirePermissions(ApiKeyPermission.DEPOSIT)
  @Post('deposit')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({
    summary: 'Initialize deposit',
    description:
      'Initialize a Paystack payment for wallet deposit. Returns payment URL. Requires JWT or API key with DEPOSIT permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Deposit initialized successfully',
    type: DepositResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid amount or Paystack error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deposit(
    @CurrentUser() user: PayloadType,
    @Body() depositDto: DepositDto,
  ): Promise<DepositResponseDto> {
    const wallet = await this.walletService.getWalletByUserId(user.userId);
    const reference = `dep_${Date.now()}_${wallet.id.substring(0, 8)}`;

    await this.transactionService.createTransaction(
      wallet.id,
      TransactionType.DEPOSIT,
      depositDto.amount,
      reference,
    );

    const { authorization_url } =
      await this.paystackService.initializeTransaction(
        user.email,
        depositDto.amount,
        reference,
      );

    return {
      reference,
      authorization_url,
    };
  }

  @UseGuards(OptionalAuthGuard)
  @RequirePermissions(ApiKeyPermission.TRANSFER)
  @Post('transfer')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({
    summary: 'Transfer to another wallet',
    description:
      'Send money from your wallet to another user. Requires JWT or API key with TRANSFER permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transfer completed successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient balance or invalid wallet number',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recipient wallet not found' })
  async transfer(
    @CurrentUser() user: PayloadType,
    @Body() transferDto: TransferDto,
  ): Promise<TransferResponseDto> {
    return await this.walletService.transfer(
      user.userId,
      transferDto.wallet_number,
      transferDto.amount,
    );
  }

  @UseGuards(OptionalAuthGuard)
  @RequirePermissions(ApiKeyPermission.READ)
  @Get('transactions')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-Key')
  @ApiOperation({
    summary: 'Get transaction history',
    description:
      'Retrieve all transactions for the authenticated user. Requires JWT or API key with READ permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: [TransactionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactions(
    @CurrentUser() user: PayloadType,
  ): Promise<TransactionResponseDto[]> {
    const wallet = await this.walletService.getWalletByUserId(user.userId);
    const transactions =
      await this.transactionService.getTransactionsByWalletId(wallet.id);

    return transactions.map(
      (t: any): TransactionResponseDto => ({
        type: t.type as TransactionType,
        amount: Number(t.amount),
        status: t.status as TransactionStatus,
      }),
    );
  }
}
