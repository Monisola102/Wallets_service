
import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '@/utils/jwt-auth.guard';
import { ApiKeyGuard } from '@/utils/Apikey.guard';

@Module({
  providers: [JwtAuthGuard, ApiKeyGuard],
  exports: [JwtAuthGuard, ApiKeyGuard], 
})
export class AuthGuardsModule {}
