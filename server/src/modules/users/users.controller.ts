import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('accounts')
  getAccounts() {
    return this.usersService.getAccounts();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('accounts')
  createAccount(@Body() body: any) {
    return this.authService.signup(body);
  }

  @Get('providers')
  getProviders() {
    return this.usersService.getProviders();
  }

  @Get('providers/:id')
  getProvider(@Param('id') id: string) {
    return this.usersService.getProviderById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.usersService.getCustomerById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.getUserProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/profile')
  updateProfile(@Param('id') id: string, @Body() body: any, @CurrentUser() actor: any) {
    return this.usersService.updateProfile(id, body, actor);
  }

  @UseGuards(JwtAuthGuard)
  @Put('customers/:id/addresses')
  saveAddresses(@Param('id') id: string, @Body() body: { addresses: any[] }, @CurrentUser() actor: any) {
    return this.usersService.saveCustomerAddresses(id, body.addresses, actor);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('providers/:id')
  saveProvider(
    @Param('id') id: string,
    @Body() body: { values?: any; submit?: boolean; [key: string]: any },
    @CurrentUser() actor: any,
  ) {
    const values = body.values || body;
    return this.usersService.saveProvider(id, values, Boolean(body.submit), actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('providers/:id/moderate')
  moderateProvider(@Param('id') id: string, @Body() body: { status: string; reason: string }) {
    return this.usersService.moderateProvider(id, body.status, body.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Put('providers/:id/availability')
  saveAvailability(@Param('id') id: string, @Body() body: any, @CurrentUser() actor: any) {
    return this.usersService.saveAvailability(id, body.schedule || body, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  deleteAccount(@Param('id') id: string) {
    return this.usersService.deleteAccount(id);
  }
}
