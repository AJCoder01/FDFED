import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string; expectedRole?: string }) {
    return this.authService.login(body.email, body.password, body.expectedRole);
  }

  @Post('signup')
  signup(@Body() body: any) {
    return this.authService.signup(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: any) {
    return this.authService.logout(user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('demo-switch')
  demoSwitch(@Body() body: { targetRole: string }, @CurrentUser() user: any) {
    return this.authService.demoSwitch(body.targetRole, user);
  }
}
