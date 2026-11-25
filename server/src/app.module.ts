import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { FinanceModule } from './modules/finance/finance.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PlatformModule } from './modules/platform/platform.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    MarketplaceModule,
    BookingsModule,
    FinanceModule,
    GovernanceModule,
    NotificationsModule,
    PlatformModule,
  ],
})
export class AppModule {}
