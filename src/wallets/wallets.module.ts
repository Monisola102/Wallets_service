import { Module, forwardRef} from '@nestjs/common';
import { WalletController } from './wallets.controller';
import { WalletService } from './wallets.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TransactionModule } from '@/transaction/transaction.module';
import { AuthModule } from '@/auth/auth.module';
import { PaystackModule } from '@/paystack/paystack.module';
@Module({
  imports: [PrismaModule, TransactionModule,AuthModule,forwardRef(() => PaystackModule) 
],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService] 

})
export class WalletsModule {}
