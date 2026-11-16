import { Module, Controller, Get } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { DatabaseModule, Database } from "./common/database";
import { AuthModule } from "./auth/auth.module";
import { AuthGuard, Public } from "./auth/auth.guard";
import { UsersModule } from "./users/users.controller";
import { MarketplaceModule } from "./marketplace/marketplace.controller";
import { BookingsModule } from "./bookings/bookings.controller";
import { SupportModule } from "./support/support.controller";
import { PlatformModule } from "./platform/platform.controller";
import { FilesModule } from "./files/files.controller";
@Controller("health")
class HealthController {
  constructor(private db: Database) {}
  @Public() @Get() async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: "ok" };
  }
}
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    MarketplaceModule,
    BookingsModule,
    SupportModule,
    PlatformModule,
    FilesModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: Math.max(1, Number(process.env.API_RATE_LIMIT) || 300) }]),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
