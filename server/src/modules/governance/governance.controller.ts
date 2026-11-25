import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('governance')
export class GovernanceController {
  constructor(private readonly govService: GovernanceService) {}

  @UseGuards(JwtAuthGuard)
  @Get('tickets')
  getTickets(@Query('role') role?: string, @Query('userId') userId?: string, @CurrentUser() actor?: any) {
    const effectiveRole = actor?.role === 'admin' ? role || 'admin' : actor?.role;
    const effectiveUserId = actor?.role === 'admin' ? userId : actor?.id;
    return this.govService.getTickets(effectiveRole, effectiveUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tickets')
  createTicket(@Body() body: any, @CurrentUser() actor: any) {
    return this.govService.createTicket(body, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('tickets/:id/resolve')
  resolveTicket(@Param('id') id: string, @Body() body: { outcome: string; notes?: string }) {
    return this.govService.resolveTicket(id, body.outcome, body.notes);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('tickets/:id')
  deleteTicket(@Param('id') id: string) {
    return this.govService.deleteTicket(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('disputes')
  getDisputes() {
    return this.govService.getDisputes();
  }

  @UseGuards(JwtAuthGuard)
  @Get('disputes/:id')
  getDispute(@Param('id') id: string) {
    return this.govService.getDisputeById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer', 'admin')
  @Post('disputes')
  createDispute(@Body() body: any, @CurrentUser() actor: any) {
    return this.govService.createDispute(body, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('disputes/:id/assign')
  assignDispute(@Param('id') id: string, @Body() body: { arbitrator: { id: string; name: string } }) {
    return this.govService.assignDispute(id, body.arbitrator);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('provider', 'admin')
  @Patch('disputes/:id/response')
  saveDisputeResponse(@Param('id') id: string, @Body() body: any, @CurrentUser() actor: any) {
    return this.govService.saveDisputeResponse(id, body, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('arbitrator', 'admin')
  @Patch('disputes/:id/hearing')
  scheduleHearing(@Param('id') id: string, @Body() body: any) {
    return this.govService.scheduleHearing(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('arbitrator', 'admin')
  @Patch('disputes/:id/ruling')
  issueRuling(@Param('id') id: string, @Body() body: any) {
    return this.govService.issueRuling(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('disputes/:id')
  deleteDispute(@Param('id') id: string) {
    return this.govService.deleteDispute(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('arbitrator-applications')
  getArbitratorApplications() {
    return this.govService.getArbitratorApplications();
  }

  @Post('arbitrator-applications')
  submitArbitratorApplication(@Body() body: any) {
    return this.govService.submitArbitratorApplication(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('arbitrator-applications/:id/approve')
  approveArbitratorApplication(@Param('id') id: string) {
    return this.govService.approveArbitratorApplication(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('arbitrator-applications/:id/reject')
  rejectArbitratorApplication(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.govService.rejectArbitratorApplication(id, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('arbitrator-applications/:id')
  deleteArbitratorApplication(@Param('id') id: string) {
    return this.govService.deleteArbitratorApplication(id);
  }
}
