import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketService: MarketplaceService) {}

  @Get('categories')
  getCategories() {
    return this.marketService.getCategories();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('categories')
  createCategory(@Body() body: any) {
    return this.marketService.createCategory(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.marketService.updateCategory(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.marketService.deleteCategory(id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('services')
  getServices(
    @Query('role') role?: string,
    @Query('userId') userId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
    @CurrentUser() actor?: any,
  ) {
    return this.marketService.getServices({
      role: role || actor?.role,
      userId: userId || actor?.id,
      category,
      search,
      maxPrice,
      sort,
    });
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('services/:id')
  getServiceById(@Param('id') id: string, @Query('role') role?: string, @CurrentUser() actor?: any) {
    const effectiveActor = actor || (role ? { role } : undefined);
    return this.marketService.getServiceById(id, effectiveActor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('provider', 'admin')
  @Post('services')
  createService(@Body() body: any, @CurrentUser() actor: any) {
    return this.marketService.saveService(body, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('provider', 'admin')
  @Patch('services/:id')
  updateService(@Param('id') id: string, @Body() body: any, @CurrentUser() actor: any) {
    return this.marketService.saveService({ ...body, id }, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('provider', 'admin')
  @Delete('services/:id')
  deleteService(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.marketService.deleteService(id, actor);
  }

  @Get('services/:id/reviews')
  getServiceReviews(@Param('id') id: string) {
    return this.marketService.getServiceReviews(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Post('reviews')
  submitReview(
    @Body() body: { bookingId: string; rating: number; comment: string },
    @CurrentUser() actor: any,
  ) {
    return this.marketService.submitReview(body.bookingId, Number(body.rating), body.comment, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('provider', 'admin')
  @Patch('reviews/:bookingId/reply')
  replyToReview(
    @Param('bookingId') bookingId: string,
    @Body() body: { reply: string },
    @CurrentUser() actor: any,
  ) {
    return this.marketService.replyToReview(bookingId, body.reply, actor);
  }

  @UseGuards(JwtAuthGuard)
  @Get('job-requests')
  getJobRequests(@CurrentUser() actor: any) {
    return this.marketService.getJobRequests(actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer', 'admin')
  @Post('job-requests')
  createJobRequest(@Body() body: any, @CurrentUser() actor: any) {
    return this.marketService.createJobRequest(body, actor);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('job-requests/:id')
  deleteJobRequest(@Param('id') id: string) {
    return this.marketService.deleteJobRequest(id);
  }
}
