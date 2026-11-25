import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('available-slots')
  getAvailableSlots(
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.bookingsService.getAvailableSlots(serviceId, date, excludeId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getBookings(@Query('role') role?: string, @Query('userId') userId?: string, @CurrentUser() actor?: any) {
    const effectiveRole = actor?.role === 'admin' ? role || 'admin' : actor?.role;
    const effectiveUserId = actor?.role === 'admin' ? userId : actor?.id;
    return this.bookingsService.getBookings(effectiveRole, effectiveUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getBooking(@Param('id') id: string) {
    return this.bookingsService.getBookingById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer', 'admin')
  @Post()
  createBooking(@Body() body: any, @CurrentUser() actor: any) {
    return this.bookingsService.createBooking(body, actor);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; note?: string; expectedStatus?: string },
    @CurrentUser() actor: any,
  ) {
    return this.bookingsService.updateBookingStatus(id, body, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('provider', 'admin')
  @Post(':id/propose-time')
  proposeTime(@Param('id') id: string, @Body() body: { date: string; slot: string }, @CurrentUser() actor: any) {
    return this.bookingsService.proposeTime(id, body.date, body.slot, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer', 'admin')
  @Post(':id/respond-time')
  respondTime(@Param('id') id: string, @Body() body: { accept: boolean }, @CurrentUser() actor: any) {
    return this.bookingsService.respondToTimeProposal(id, body.accept, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  deleteBooking(@Param('id') id: string) {
    return this.bookingsService.deleteBooking(id);
  }
}
