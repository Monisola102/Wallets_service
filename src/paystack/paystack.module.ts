import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaystackService } from './paystack.service';
import { PaystackController } from './paystack.controller';
import { WalletsModule } from '@/wallets/wallets.module';
import { TransactionModule } from '@/transaction/transaction.module';

@Module({
  imports: [HttpModule, forwardRef(() => WalletsModule), TransactionModule],
  providers: [PaystackService],
  controllers: [PaystackController],
  exports: [PaystackService],
})
export class PaystackModule {}
