import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'servicehub-api', timestamp: new Date().toISOString() };
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity-logs')
  getActivityLogs(@Query('userId') userId?: string) {
    return this.platformService.getActivityLogs(userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('activity-logs')
  createActivityLog(@Body() body: any, @CurrentUser() actor?: any) {
    return this.platformService.createActivityLog(body, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('activity-logs/:id')
  updateActivityLog(@Param('id') id: string, @Body() body: any) {
    return this.platformService.updateActivityLog(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('activity-logs/:id')
  deleteActivityLog(@Param('id') id: string) {
    return this.platformService.deleteActivityLog(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('stats')
  getStats() {
    return this.platformService.getStats();
  }

  @Post('reset-demo')
  resetDemo() {
    return this.platformService.resetDemo();
  }
}
