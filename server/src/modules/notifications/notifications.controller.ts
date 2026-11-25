import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Get()
  getNotifications(@Query('userId') userId?: string, @CurrentUser() actor?: any) {
    const targetUserId = actor?.role === 'admin' && userId ? userId : actor?.id;
    return this.notifService.getNotifications(targetUserId);
  }

  @Post()
  createNotification(@Body() body: any, @CurrentUser() actor: any) {
    return this.notifService.createNotification(body, actor.id);
  }

  @Patch('read')
  markRead(@Body() body: { notificationId?: string; userId?: string }, @CurrentUser() actor: any) {
    const targetUserId = actor?.role === 'admin' && body.userId ? body.userId : actor?.id;
    return this.notifService.markRead(targetUserId, body.notificationId);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string) {
    return this.notifService.deleteOne(id);
  }

  @Delete()
  clearAll(@CurrentUser() actor: any) {
    return this.notifService.clearForUser(actor.id);
  }
}
