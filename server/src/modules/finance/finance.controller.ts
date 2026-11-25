import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('wallet')
  getMyWallet(@CurrentUser() actor: any) {
    return this.financeService.getWallet(actor.id);
  }

  @Post('wallet/topup')
  topUpWallet(@Body() body: { amount: number; method?: string }, @CurrentUser() actor: any) {
    return this.financeService.topUpWallet(actor.id, Number(body.amount), body.method);
  }

  @Post('wallet/withdraw')
  withdrawWallet(@Body() body: { amount: number; destination?: string }, @CurrentUser() actor: any) {
    return this.financeService.withdrawWallet(actor.id, Number(body.amount), body.destination);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('revenue')
  getRevenueStats() {
    return this.financeService.getRevenueStats();
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'provider')
  @Get('ledgers')
  getLedgers(@CurrentUser() actor: any) {
    return this.financeService.getLedgers(actor);
  }

  @UseGuards(RolesGuard)
  @Roles('provider', 'admin')
  @Get('provider-earnings/:providerId')
  getProviderEarnings(@Param('providerId') providerId: string) {
    return this.financeService.getProviderEarnings(providerId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'arbitrator')
  @Post('refunds')
  issueRefund(@Body() body: { bookingId: string; amount: number }) {
    return this.financeService.issueRefund(body.bookingId, Number(body.amount));
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('ledgers')
  createLedger(@Body() body: any) {
    return this.financeService.createLedger(body);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('ledgers/:id')
  updateLedger(@Param('id') id: string, @Body() body: any) {
    return this.financeService.updateLedger(id, body);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete('ledgers/:id')
  deleteLedger(@Param('id') id: string) {
    return this.financeService.deleteLedger(id);
  }
}
